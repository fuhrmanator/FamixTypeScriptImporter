/**
 * a function getOrCreateXType takes arguments name: string and element: ts-morph-type and returns a Famix.Type
 * The goal is to keep track of the types (e.g., a method's definedType), for the model.
 * The name doesn't need to be fully qualified (it's the name used in the source code, or the Famix model).
 */


import { ClassDeclaration, ConstructorDeclaration, FunctionDeclaration, Identifier, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, PropertyDeclaration, PropertySignature, SourceFile, TypeParameterDeclaration, VariableDeclaration, ParameterDeclaration, Decorator, GetAccessorDeclaration, SetAccessorDeclaration, ImportSpecifier, CommentRange, EnumDeclaration, EnumMember, TypeAliasDeclaration, FunctionExpression, ImportDeclaration, ImportEqualsDeclaration, SyntaxKind, Expression, TypeNode, Scope, ArrowFunction, ExpressionWithTypeArguments, HeritageClause, ts, Type } from "ts-morph";
import { isAmbient, isNamespace } from "../analyze_functions/process_functions";
import * as Famix from "../lib/famix/model/famix";
import { FamixRepository } from "../lib/famix/famix_repository";
import { logger, config } from "../analyze";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import GraphemeSplitter = require('grapheme-splitter');
import * as Helpers from "./helpers_creation";
import * as FQNFunctions from "../fqn";
import path from "path";

export type TSMorphObjectType = ImportDeclaration | ImportEqualsDeclaration | SourceFile | ModuleDeclaration | ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | PropertyDeclaration | PropertySignature | TypeParameterDeclaration | Identifier | Decorator | GetAccessorDeclaration | SetAccessorDeclaration | ImportSpecifier | CommentRange | EnumDeclaration | EnumMember | TypeAliasDeclaration | ExpressionWithTypeArguments | TSMorphParametricType;

export type TSMorphTypeDeclaration = TypeAliasDeclaration | PropertyDeclaration | PropertySignature | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | EnumMember | ImportEqualsDeclaration | TSMorphParametricType | TypeParameterDeclaration;

export type TSMorphParametricType = ClassDeclaration | InterfaceDeclaration | FunctionDeclaration | MethodDeclaration | ArrowFunction;

type ParametricVariantType = Famix.ParametricClass | Famix.ParametricInterface | Famix.ParametricFunction | Famix.ParametricMethod;

type ConcreteElementTSMorphType = ClassDeclaration | InterfaceDeclaration | FunctionDeclaration | MethodDeclaration;

export type InvocableType = MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ArrowFunction;

export class EntityDictionary {
    
    public famixRep = new FamixRepository();
    private fmxAliasMap = new Map<string, Famix.Alias>(); // Maps the alias names to their Famix model
    private fmxClassMap = new Map<string, Famix.Class | Famix.ParametricClass>(); // Maps the fully qualified class names to their Famix model
    private fmxInterfaceMap = new Map<string, Famix.Interface | Famix.ParametricInterface>(); // Maps the interface names to their Famix model
    private fmxModuleMap = new Map<ModuleDeclaration, Famix.Module>(); // Maps the namespace names to their Famix model
    private fmxFileMap = new Map<string, Famix.ScriptEntity | Famix.Module>(); // Maps the source file names to their Famix model
    private fmxTypeMap = new Map<TSMorphTypeDeclaration, Famix.Type | Famix.ParameterType>(); // Maps the types declarations to their Famix model
    private fmxPrimitiveTypeMap = new Map<string, Famix.PrimitiveType>(); // Maps the primitive type names to their Famix model
    private fmxFunctionAndMethodMap = new Map<string, Famix.Function | Famix.ParametricFunction | Famix.Method | Famix.ParametricMethod>; // Maps the function names to their Famix model
    private fmxArrowFunctionMap = new Map<string, Famix.ArrowFunction>; // Maps the function names to their Famix model
    private fmxParameterMap = new Map<ParameterDeclaration, Famix.Parameter>(); // Maps the parameters to their Famix model
    private fmxVariableMap = new Map<VariableDeclaration, Famix.Variable>(); // Maps the variables to their Famix model
    private fmxImportClauseMap = new Map<ImportDeclaration | ImportEqualsDeclaration, Famix.ImportClause>(); // Maps the import clauses to their Famix model
    private fmxEnumMap = new Map<EnumDeclaration, Famix.Enum>(); // Maps the enum names to their Famix model
    private fmxInheritanceMap = new Map<string, Famix.Inheritance>(); // Maps the inheritance names to their Famix model
    private UNKNOWN_VALUE = '(unknown due to parsing error)'; // The value to use when a name is not usable
    public fmxElementObjectMap = new Map<Famix.Entity,TSMorphObjectType>();
    public tsMorphElementObjectMap = new Map<TSMorphObjectType,Famix.Entity>();
            
    constructor() {
        this.famixRep.setFmxElementObjectMap(this.fmxElementObjectMap);      
    }

    public addSourceAnchor(fmx: Famix.SourcedEntity, node: TSMorphObjectType): Famix.IndexedFileAnchor {
        const sourceAnchor: Famix.IndexedFileAnchor = new Famix.IndexedFileAnchor();
        let sourceStart, sourceEnd: number;
        if (fmx && node) {
            // find the start and end positions of the source element
            if (!(node instanceof CommentRange)) {
                sourceStart = node.getStart();
                sourceEnd = node.getEnd();
            } else {
                sourceStart = node.getPos();
                sourceEnd = node.getEnd();
            }
    
            if (config.expectGraphemes) {
                /**
                 * The following logic handles the case of multi-code point characters (e.g. emoji) in the source text.
                 * This is needed because Pharo/Smalltalk treats multi-code point characters as a single character, 
                 * but JavaScript treats them as multiple characters. This means that the start and end positions
                 * of a source element in Pharo/Smalltalk will be different than the start and end positions of the
                 * same source element in JavaScript. This logic finds the start and end positions of the source
                 * element in JavaScript and then uses those positions to set the start and end positions of the
                 * Famix index file anchor.
                 * It depends on code in the 'grapheme-splitter' package in npm.
                 */
                const splitter = new GraphemeSplitter();
                const sourceFileText = node.getSourceFile().getFullText();
                const hasGraphemeClusters = splitter.countGraphemes(sourceFileText) > 1;
                if (hasGraphemeClusters) {
                    const sourceElementText = sourceFileText.substring(sourceStart, sourceEnd);
                    const sourceElementTextGraphemes = splitter.splitGraphemes(sourceElementText);
                    const sourceFileTextGraphemes = splitter.splitGraphemes(sourceFileText);
                    const numberOfGraphemeClustersBeforeStart = splitter.countGraphemes(sourceFileText.substring(0, sourceStart));
        
                    // find the start of the sourceElementTextGraphemes array in the sourceFileTextGraphemes array
                    sourceStart = Helpers.indexOfSplitArray({searchArray: sourceFileTextGraphemes, 
                                                        targetArray: sourceElementTextGraphemes, 
                                                        start: sourceStart - numberOfGraphemeClustersBeforeStart});
                    sourceEnd = sourceStart + sourceElementTextGraphemes.length;
                } 
            }

            // The +1 is because the source anchor (Pharo) is 1-based, but ts-morph is 0-based
            sourceAnchor.startPos = sourceStart + 1;
            sourceAnchor.endPos = sourceEnd + 1;

            let fileName = node.getSourceFile().getFilePath() as string;
            if (fileName.startsWith("/")) {
                fileName = fileName.substring(1);
            }
            sourceAnchor.element = fmx;
            sourceAnchor.fileName = fileName;
            fmx.sourceAnchor = sourceAnchor;
            this.famixRep.addElement(sourceAnchor);

        }
        return sourceAnchor;
    }

    /**
     * Makes a Famix index file anchor
     * @param sourceElement A source element
     * @param famixElement The Famix model of the source element
     */
    public makeFamixIndexFileAnchor(sourceElement: TSMorphObjectType, famixElement: Famix.SourcedEntity): void {
        // Famix.Comment is not a named entity (does not have a fullyQualifiedName)
        if (!(famixElement instanceof Famix.Comment)) {  // must be a named entity
            // insanity check: named entities should have fullyQualifiedName
            const fullyQualifiedName = (famixElement as Famix.NamedEntity).fullyQualifiedName;
            if (!fullyQualifiedName || fullyQualifiedName === this.UNKNOWN_VALUE) {
                throw new Error(`Famix element ${famixElement.constructor.name} has no valid fullyQualifiedName.`);
            }
        }

        logger.debug("making index file anchor for '" + sourceElement?.getText() + "' with famixElement " + famixElement.getJSON());
        const fmxIndexFileAnchor = new Famix.IndexedFileAnchor();
        fmxIndexFileAnchor.element = famixElement;
        this.fmxElementObjectMap.set(famixElement, sourceElement);

        if (sourceElement !== null) {
            const absolutePathProject = this.famixRep.getAbsolutePath();
        
            const absolutePath = path.normalize(sourceElement.getSourceFile().getFilePath());

            const positionNodeModules = absolutePath.indexOf('node_modules');

            let pathInProject: string = "";

            if (positionNodeModules !== -1) {
                const pathFromNodeModules = absolutePath.substring(positionNodeModules);
                pathInProject = pathFromNodeModules;
            } else {
                pathInProject = this.convertToRelativePath(absolutePath, absolutePathProject);
            }

            // revert any backslashes to forward slashes (path.normalize on windows introduces them)
            pathInProject = pathInProject.replace(/\\/g, "/");

            if (pathInProject.startsWith("/")) {
                pathInProject = pathInProject.substring(1);
            }

            fmxIndexFileAnchor.fileName = pathInProject;
            let sourceStart, sourceEnd
            // ,sourceLineStart, sourceLineEnd
            : number;
            if (!(sourceElement instanceof CommentRange)) {
                sourceStart = sourceElement.getStart();
                sourceEnd = sourceElement.getEnd();
                // sourceLineStart = sourceElement.getStartLineNumber();
                // sourceLineEnd = sourceElement.getEndLineNumber();
            } else {
                sourceStart = sourceElement.getPos();
                sourceEnd = sourceElement.getEnd();
            }
            if (config.expectGraphemes) {
                /**
                 * The following logic handles the case of multi-code point characters (e.g. emoji) in the source text.
                 * This is needed because Pharo/Smalltalk treats multi-code point characters as a single character, 
                 * but JavaScript treats them as multiple characters. This means that the start and end positions
                 * of a source element in Pharo/Smalltalk will be different than the start and end positions of the
                 * same source element in JavaScript. This logic finds the start and end positions of the source
                 * element in JavaScript and then uses those positions to set the start and end positions of the
                 * Famix index file anchor.
                 * It depends on code in the 'grapheme-splitter' package in npm.
                 */
                const splitter = new GraphemeSplitter();
                const sourceFileText = sourceElement.getSourceFile().getFullText();
                const hasGraphemeClusters = splitter.countGraphemes(sourceFileText) > 1;
                if (hasGraphemeClusters) {
                    const sourceElementText = sourceFileText.substring(sourceStart, sourceEnd);
                    const sourceElementTextGraphemes = splitter.splitGraphemes(sourceElementText);
                    const sourceFileTextGraphemes = splitter.splitGraphemes(sourceFileText);
                    const numberOfGraphemeClustersBeforeStart = splitter.countGraphemes(sourceFileText.substring(0, sourceStart));
        
                    // find the start of the sourceElementTextGraphemes array in the sourceFileTextGraphemes array
                    sourceStart = Helpers.indexOfSplitArray({searchArray: sourceFileTextGraphemes, 
                                                        targetArray: sourceElementTextGraphemes, 
                                                        start: sourceStart - numberOfGraphemeClustersBeforeStart});
                    sourceEnd = sourceStart + sourceElementTextGraphemes.length;
                } 
            }
            // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
            fmxIndexFileAnchor.startPos = sourceStart + 1;
            fmxIndexFileAnchor.endPos = sourceEnd + 1;

            // if (!(famixElement instanceof Famix.ImportClause || famixElement instanceof Famix.Access || famixElement instanceof Famix.Reference || famixElement instanceof Famix.Invocation || famixElement instanceof Famix.Inheritance) && !(famixElement instanceof Famix.Comment) && !(sourceElement instanceof CommentRange) && !(sourceElement instanceof Identifier) && !(sourceElement instanceof ImportSpecifier) && !(sourceElement instanceof ExpressionWithTypeArguments)) {
            //    initFQN(sourceElement, famixElement);
            // }
        } else {
            // sourceElement is null
            logger.warn("sourceElement is null for famixElement " + famixElement.getJSON());
            fmxIndexFileAnchor.fileName = "unknown";
            fmxIndexFileAnchor.startPos = 0;
            fmxIndexFileAnchor.endPos = 0;
        }

        this.famixRep.addElement(fmxIndexFileAnchor);
    }

    /**
     * Creates or gets a Famix script entity or module
     * @param f A source file
     * @param isModule A boolean indicating if the source file is a module
     * @returns The Famix model of the source file
     */
    public createOrGetFamixFile(f: SourceFile, isModule: boolean): Famix.ScriptEntity | Famix.Module {
        let fmxFile: Famix.ScriptEntity; // | Famix.Module;

        const fileName = f.getBaseName();
        const fullyQualifiedFilename = f.getFilePath();
        const foundFileName = this.fmxFileMap.get(fullyQualifiedFilename);
        if (!foundFileName) {
            if (isModule) {
                fmxFile = new Famix.Module();
            }
            else {
                fmxFile = new Famix.ScriptEntity();
            }
            fmxFile.name = fileName;
            fmxFile.numberOfLinesOfText = f.getEndLineNumber() - f.getStartLineNumber();
            fmxFile.numberOfCharacters = f.getFullText().length;

            initFQN(f, fmxFile);

            this.makeFamixIndexFileAnchor(f, fmxFile);

            this.fmxFileMap.set(fullyQualifiedFilename, fmxFile);
            this.famixRep.addElement(fmxFile);
        }
        else {
            fmxFile = foundFileName;
        }

        this.fmxElementObjectMap.set(fmxFile,f);
        return fmxFile;
    }

    /**
     * Creates or gets a Famix Module
     * @param moduleDeclaration A module
     * @returns The Famix model of the module
     */
    public createOrGetFamixModule(moduleDeclaration: ModuleDeclaration): Famix.Module {
        if (this.fmxModuleMap.has(moduleDeclaration)) {
            const rModule = this.fmxModuleMap.get(moduleDeclaration);
            if (rModule) { 
               return rModule;
            } else {
                throw new Error(`Famix module ${moduleDeclaration.getName()} is not found in the module map.`);
            }
        }

        const fmxModule = new Famix.Module();
        const moduleName = moduleDeclaration.getName();
        fmxModule.name = moduleName;
        fmxModule.isAmbient = isAmbient(moduleDeclaration);
        fmxModule.isNamespace = isNamespace(moduleDeclaration);
        fmxModule.isModule = !fmxModule.isNamespace && !fmxModule.isAmbient;

        initFQN(moduleDeclaration, fmxModule);
        this.makeFamixIndexFileAnchor(moduleDeclaration, fmxModule);

        this.fmxModuleMap.set(moduleDeclaration, fmxModule);

        this.famixRep.addElement(fmxModule);

        this.fmxElementObjectMap.set(fmxModule,moduleDeclaration);
        return fmxModule;
    }

    /**
     * Creates a Famix alias
     * @param typeAliasDeclaration An alias
     * @returns The Famix model of the alias
     */
    public createFamixAlias(typeAliasDeclaration: TypeAliasDeclaration): Famix.Alias {
        let fmxAlias: Famix.Alias;
        const aliasName = typeAliasDeclaration.getName();
        //const aliasFullyQualifiedName = a.getType().getText(); // FQNFunctions.getFQN(a);
        const aliasFullyQualifiedName = FQNFunctions.getFQN(typeAliasDeclaration);
        const foundAlias = this.fmxAliasMap.get(aliasFullyQualifiedName);
        if (!foundAlias) {
            fmxAlias = new Famix.Alias();
            fmxAlias.name = typeAliasDeclaration.getName();
            const aliasNameWithGenerics = aliasName + (typeAliasDeclaration.getTypeParameters().length ? ("<" + typeAliasDeclaration.getTypeParameters().map(tp => tp.getName()).join(", ") + ">") : "");
            logger.debug(`> NOTE: alias ${aliasName} has fully qualified name ${aliasFullyQualifiedName} and name with generics ${aliasNameWithGenerics}.`);

            const fmxType = this.createOrGetFamixType(aliasNameWithGenerics, typeAliasDeclaration.getType(), typeAliasDeclaration);
            fmxAlias.aliasedEntity = fmxType;
            initFQN(typeAliasDeclaration, fmxAlias);
            this.makeFamixIndexFileAnchor(typeAliasDeclaration, fmxAlias);

            this.fmxAliasMap.set(aliasFullyQualifiedName, fmxAlias);

            this.famixRep.addElement(fmxAlias);
        }
        else {
            fmxAlias = foundAlias;
        }
        this.fmxElementObjectMap.set(fmxAlias,typeAliasDeclaration);

        return fmxAlias;
    }

    /**
     * Creates or gets a Famix class or parameterizable class
     * @param cls A class
     * @returns The Famix model of the class
     */
    public createOrGetFamixClass(cls: ClassDeclaration): Famix.Class | Famix.ParametricClass {
        let fmxClass: Famix.Class | Famix.ParametricClass;
        const isAbstract = cls.isAbstract();
        const classFullyQualifiedName = FQNFunctions.getFQN(cls);
        const clsName = cls.getName() || this.UNKNOWN_VALUE;
        const isGeneric = cls.getTypeParameters().length;
        const foundClass = this.fmxClassMap.get(classFullyQualifiedName);
        if (!foundClass) {
            if (isGeneric) {
                fmxClass = new Famix.ParametricClass();
            }
            else {
                fmxClass = new Famix.Class();
            }

            fmxClass.name = clsName;
            initFQN(cls, fmxClass);
            // fmxClass.fullyQualifiedName = classFullyQualifiedName;
            fmxClass.isAbstract = isAbstract;

            this.makeFamixIndexFileAnchor(cls, fmxClass);

            this.fmxClassMap.set(classFullyQualifiedName, fmxClass);

            this.famixRep.addElement(fmxClass);

            this.fmxElementObjectMap.set(fmxClass,cls);
        }
        else {
            fmxClass = foundClass;
        }

        return fmxClass;
    }

    /**
     * Creates or gets a Famix interface or parameterizable interface
     * @param inter An interface
     * @returns The Famix model of the interface
     */
    public createOrGetFamixInterface(inter: InterfaceDeclaration): Famix.Interface | Famix.ParametricInterface {

        let fmxInterface: Famix.Interface | Famix.ParametricInterface;
        const interName = inter.getName();
        const interFullyQualifiedName = FQNFunctions.getFQN(inter);
        const foundInterface = this.fmxInterfaceMap.get(interFullyQualifiedName);
        if (!foundInterface) {
            const isGeneric = inter.getTypeParameters().length;
            if (isGeneric) {
                fmxInterface = new Famix.ParametricInterface();
            }
            else {
                fmxInterface = new Famix.Interface();
            }

            fmxInterface.name = interName;
            initFQN(inter, fmxInterface);
            this.makeFamixIndexFileAnchor(inter, fmxInterface);

            this.fmxInterfaceMap.set(interFullyQualifiedName, fmxInterface);

            this.famixRep.addElement(fmxInterface);

            this.fmxElementObjectMap.set(fmxInterface,inter);
        }
        else {
            fmxInterface = foundInterface;
        }
        return fmxInterface;
    }

    
    /**
     * Creates or gets a Famix concrete element
     * @param concreteElement A parametric Element   
     * @param concreteElementDeclaration the element declaration
     * @param concreteArguments concrete arguments
     * @returns A parametric Element  
     */
    public createOrGetFamixConcreteElement(concreteElement : ParametricVariantType, 
                                           concreteElementDeclaration : ConcreteElementTSMorphType, 
                                           concreteArguments: TypeNode[]): ParametricVariantType {
        
        let fullyQualifiedFilename = concreteElement.fullyQualifiedName;
        let params = "";
        
        concreteArguments.map((param) => {
            params = params+param.getText()+',';
        });
        
        params = params.substring(0, params.length - 1);
                
        fullyQualifiedFilename = Helpers.replaceLastBetweenTags(fullyQualifiedFilename,params);

        let concElement: ParametricVariantType;

        if (!this.fmxInterfaceMap.has(fullyQualifiedFilename) && 
            !this.fmxClassMap.has(fullyQualifiedFilename) && 
            !this.fmxFunctionAndMethodMap.has(fullyQualifiedFilename)){
            concElement = _.cloneDeep(concreteElement); 
            concElement.fullyQualifiedName = fullyQualifiedFilename;
            concElement.clearGenericParameters();
            concreteArguments.map((param) => {
                const parameter = this.createOrGetFamixConcreteType(param);
                concElement.addConcreteParameter(parameter);
            })
            
            if (concreteElement instanceof Famix.ParametricClass) {
                this.fmxClassMap.set(fullyQualifiedFilename, concElement as Famix.ParametricClass);
            } else if (concreteElement instanceof Famix.ParametricInterface) {
                this.fmxInterfaceMap.set(fullyQualifiedFilename, concElement as Famix.ParametricInterface);
            } else if (concreteElement instanceof Famix.ParametricFunction) {
                this.fmxFunctionAndMethodMap.set(fullyQualifiedFilename, concElement as Famix.ParametricFunction);
            } else { // if (concreteElement instanceof Famix.ParametricMethod) {
                this.fmxFunctionAndMethodMap.set(fullyQualifiedFilename, concElement as Famix.ParametricMethod);
            }
            this.famixRep.addElement(concElement);
            this.fmxElementObjectMap.set(concElement,concreteElementDeclaration);
        } else {
            if (concreteElement instanceof Famix.ParametricClass) {
                concElement = this.fmxClassMap.get(fullyQualifiedFilename) as Famix.ParametricClass;
            } else if (concreteElement instanceof Famix.ParametricInterface) {
                concElement = this.fmxInterfaceMap.get(fullyQualifiedFilename) as Famix.ParametricInterface;
            } else if (concreteElement instanceof Famix.ParametricFunction) {
                concElement = this.fmxFunctionAndMethodMap.get(fullyQualifiedFilename) as Famix.ParametricFunction;
            } else {  // if (concreteElement instanceof Famix.ParametricMethod) {
                concElement = this.fmxFunctionAndMethodMap.get(fullyQualifiedFilename) as Famix.ParametricMethod;
            }
        }
        return concElement;
    }

    /**
     * Creates a Famix property
     * @param property A property
     * @returns The Famix model of the property
     */
    public createFamixProperty(property: PropertyDeclaration | PropertySignature): Famix.Property {
        const fmxProperty = new Famix.Property();
        const isSignature = property instanceof PropertySignature;
        fmxProperty.name = property.getName();

        let propTypeName = this.UNKNOWN_VALUE;
        try {
            propTypeName = property.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for property: ${property.getName()}. Continuing...`);
        }

        const fmxType = this.createOrGetFamixType(propTypeName, property.getType(), property);
        fmxProperty.declaredType = fmxType;

        // add the visibility (public, private, etc.) to the fmxProperty
        fmxProperty.visibility = "";

        property.getModifiers().forEach(m => {
            switch (m.getText()) {
                case Scope.Public:
                    fmxProperty.visibility = "public";
                    break;
                case Scope.Protected:
                    fmxProperty.visibility = "protected";
                    break;
                case Scope.Private:
                    fmxProperty.visibility = "private";
                    break;
                case "static":
                    fmxProperty.isClassSide = true;
                    break;
                case "readonly":
                    fmxProperty.readOnly = true;
                    break;
                default:
                    break;
            }
        });

        if (!isSignature && property.getExclamationTokenNode()) {
            fmxProperty.isDefinitelyAssigned = true;
        }
        if (property.getQuestionTokenNode()) {
            fmxProperty.isOptional = true;
        }
        if (property.getName().substring(0, 1) === "#") {
            fmxProperty.isJavaScriptPrivate = true;
        }

        initFQN(property, fmxProperty);
        this.makeFamixIndexFileAnchor(property, fmxProperty);

        this.famixRep.addElement(fmxProperty);

        this.fmxElementObjectMap.set(fmxProperty,property);

        return fmxProperty;
    }

    /**
     * Creates a Famix method or accessor
     * @param method A method or an accessor
     * @param currentCC The cyclomatic complexity metrics of the current source file
     * @returns The Famix model of the method or the accessor
     */
    public createOrGetFamixMethod(
        method: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration,
        currentCC: { [key: string]: number }
    ): Famix.Method | Famix.Accessor | Famix.ParametricMethod { 
        // console.log(`\n=== Creating/Getting Method ===`);
        // console.log(`Method kind: ${method.getKindName()}`);
        // console.log(`Method text: ${method.getText().slice(0, 50)}...`);
        const fqn = FQNFunctions.getFQN(method);
        // console.log(`Method FQN: ${fqn}`);
        logger.debug(`Processing method ${fqn}`);
       
    
        let fmxMethod = this.fmxFunctionAndMethodMap.get(fqn) as Famix.Method | Famix.Accessor | Famix.ParametricMethod;
        if (!fmxMethod) {
            // console.log('Method not found in map, creating new');
            const isGeneric = method.getTypeParameters().length > 0;
            if (method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) {
                fmxMethod = new Famix.Accessor();
                const isGetter = method instanceof GetAccessorDeclaration;
                const isSetter = method instanceof SetAccessorDeclaration;
                if (isGetter) { (fmxMethod as Famix.Accessor).kind = "getter"; }
                if (isSetter) { (fmxMethod as Famix.Accessor).kind = "setter"; }
            } else {
                fmxMethod = isGeneric ? new Famix.ParametricMethod() : new Famix.Method();
            }
    
            const isConstructor = method instanceof ConstructorDeclaration;
            const isSignature = method instanceof MethodSignature;
            let isAbstract = false;
            let isStatic = false;
            if (method instanceof MethodDeclaration || method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) {
                isAbstract = method.isAbstract();
                isStatic = method.isStatic();
            }
    
            if (isConstructor) { (fmxMethod as Famix.Accessor).kind = "constructor"; }
            fmxMethod.isAbstract = isAbstract;
            fmxMethod.isClassSide = isStatic;
            fmxMethod.isPrivate = (method instanceof MethodDeclaration || method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration)
                ? !!method.getModifiers().find(x => x.getText() === 'private') : false;
            fmxMethod.isProtected = (method instanceof MethodDeclaration || method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration)
                ? !!method.getModifiers().find(x => x.getText() === 'protected') : false;
            fmxMethod.signature = Helpers.computeSignature(method.getText());
    
            const methodName = isConstructor ? "constructor" : method.getName();
            fmxMethod.name = methodName;
    
            if (!isConstructor && methodName.startsWith("#")) {
                fmxMethod.isPrivate = true;
            }
            fmxMethod.isPublic = !fmxMethod.isPrivate && !fmxMethod.isProtected;
    
            fmxMethod.cyclomaticComplexity = isSignature ? 0 : (currentCC[methodName] || 0);
            let methodTypeName = this.UNKNOWN_VALUE;
            try {
                methodTypeName = method.getReturnType().getText().trim();
                logger.debug(`Method return type: ${methodTypeName}`);
            } catch (error) {
                logger.error(`Failed to get return type for ${fqn}: ${error}`);
            }
    
            const fmxType = this.createOrGetFamixType(methodTypeName, method.getType(), method);
            // console.log(`Created/retrieved return type with FQN: ${fmxType.fullyQualifiedName}`);
            fmxMethod.declaredType = fmxType;
            fmxMethod.numberOfLinesOfCode = method.getEndLineNumber() - method.getStartLineNumber();
            fmxMethod.numberOfParameters = method.getParameters().length;
            fmxMethod.numberOfStatements = isSignature ? 0 : method.getStatements().length;
    
            // Add to famixRep
            initFQN(method, fmxMethod);
            this.famixRep.addElement(fmxMethod);
            this.makeFamixIndexFileAnchor(method, fmxMethod);
            this.fmxFunctionAndMethodMap.set(fqn, fmxMethod);
            logger.debug(`Added method ${fqn} to famixRep`);
        } else {
            logger.debug(`Method ${fqn} already exists`);
        }
    
        this.fmxElementObjectMap.set(fmxMethod, method);
        return fmxMethod;
    }

    /**
     * Creates a Famix function
     * @param func A function
     * @param currentCC The cyclomatic complexity metrics of the current source file
     * @returns The Famix model of the function
     */
    public createOrGetFamixFunction(func: FunctionDeclaration | FunctionExpression, currentCC: { [key: string]: number }): Famix.Function | Famix.ParametricFunction {
        let fmxFunction: Famix.Function | Famix.ParametricFunction;
        const isGeneric = func.getTypeParameters().length > 0;
        const functionFullyQualifiedName = FQNFunctions.getFQN(func);
        if (!this.fmxFunctionAndMethodMap.has(functionFullyQualifiedName)) {
            if (isGeneric) {
                fmxFunction = new Famix.ParametricFunction();
            }
            else {
                fmxFunction = new Famix.Function();
            }
    
            const name = func.getName();
            if (name) {
                fmxFunction.name = name;
            }
            else {
                fmxFunction.name = "anonymous";
            }

            fmxFunction.signature = Helpers.computeSignature(func.getText());
            fmxFunction.cyclomaticComplexity = currentCC[fmxFunction.name];
            initFQN(func, fmxFunction);
            // fmxFunction.fullyQualifiedName = functionFullyQualifiedName;
    
            let functionTypeName = this.UNKNOWN_VALUE;
            try {
                functionTypeName = func.getReturnType().getText().trim();
            } catch (error) {
                logger.error(`> WARNING: got exception ${error}. Failed to get usable name for return type of function: ${func.getName()}. Continuing...`);
            }
    
            const fmxType = this.createOrGetFamixType(functionTypeName, func.getType(), func);
            fmxFunction.declaredType = fmxType;
            fmxFunction.numberOfLinesOfCode = func.getEndLineNumber() - func.getStartLineNumber();
            const parameters = func.getParameters();
            fmxFunction.numberOfParameters = parameters.length;
            fmxFunction.numberOfStatements = func.getStatements().length;
            this.makeFamixIndexFileAnchor(func, fmxFunction);
    
            this.famixRep.addElement(fmxFunction);
    
            this.fmxElementObjectMap.set(fmxFunction,func);

            this.fmxFunctionAndMethodMap.set(functionFullyQualifiedName, fmxFunction);
        }
        else {
            fmxFunction = this.fmxFunctionAndMethodMap.get(functionFullyQualifiedName) as (Famix.Function | Famix.ParametricFunction);
        }

        return fmxFunction;
    }

    /**
     * Creates a Famix parameter
     * @param param A parameter
     * @returns The Famix model of the parameter
     */
    public createOrGetFamixParameter(param: ParameterDeclaration): Famix.Parameter {
        if (this.fmxParameterMap.has(param)) {
            const rParameter = this.fmxParameterMap.get(param);
            if (rParameter) { 
               return rParameter;
            } else {
                throw new Error(`Famix parameter ${param.getName()} is not found in the parameter map.`);
            }
        }

        const fmxParam = new Famix.Parameter();

        let paramTypeName = this.UNKNOWN_VALUE;
        try {
            paramTypeName = param.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for parameter: ${param.getName()}. Continuing...`);
        }

        const fmxType = this.createOrGetFamixType(paramTypeName, param.getType(), param);
        fmxParam.declaredType = fmxType;
        fmxParam.name = param.getName();

        initFQN(param, fmxParam);
        this.makeFamixIndexFileAnchor(param, fmxParam);

        this.famixRep.addElement(fmxParam);

        this.fmxElementObjectMap.set(fmxParam, param);
        this.fmxParameterMap.set(param, fmxParam);

        return fmxParam;
    }

    /**
     * Creates a Famix type parameter
     * @param tp A type parameter
     * @returns The Famix model of the type parameter
     */
    public createFamixParameterType(tp: TypeParameterDeclaration): Famix.ParameterType {
        
        const fmxParameterType = new Famix.ParameterType();
   
        fmxParameterType.name = tp.getName();      
        initFQN(tp, fmxParameterType);
        this.makeFamixIndexFileAnchor(tp, fmxParameterType);

        this.famixRep.addElement(fmxParameterType);

        this.fmxElementObjectMap.set(fmxParameterType,tp);

        return fmxParameterType;
    }


    /**
     * Creates a Famix type in the context of concretizations
     * @param typeName A type name
     * @param element An element
     * @returns The Famix model of the type
     */
    public createOrGetFamixConcreteType(element: TypeNode): 
        Famix.ParameterType | Famix.PrimitiveType | Famix.Class | Famix.Interface {
        // TODO - refactor to stop using names as a key in the maps, use ts-morph element instead
        const typeParameterDeclaration = element.getSymbol()?.getDeclarations()[0] as TypeParameterDeclaration;
        // const parameterTypeName : string = element.getText();
        const parameterTypeName = getPrimitiveTypeName(element.getType()) || element.getText();
        let fmxParameterType: Famix.Type | Famix.Class | Famix.Interface | undefined = undefined;

        // get a TypeReference from a TypeNode
        const typeReference = element.getType();
        // get a TypeDeclaration from a TypeReference
        const typeDeclaration = typeReference.getSymbol()?.getDeclarations()[0] as TSMorphTypeDeclaration;

        let isClassOrInterface = false;
        if (this.fmxClassMap.has(parameterTypeName)){
            this.fmxClassMap.forEach((obj, name) => {
                if(obj instanceof Famix.ParametricClass){
                    if (name === element.getText() && obj.genericParameters.size>0) {
                        fmxParameterType = obj;
                        isClassOrInterface = true;
                    } 
                } else {
                    if (name === element.getText()) {
                        fmxParameterType = obj;
                        isClassOrInterface = true;
                    } 
                }   
            });
        }

        if (this.fmxInterfaceMap.has(parameterTypeName)){
            this.fmxInterfaceMap.forEach((obj, name) => {
                if(obj instanceof Famix.ParametricInterface){
                    if (name === element.getText() && obj.genericParameters.size>0) {
                        fmxParameterType = obj;
                        isClassOrInterface = true;
                    } 
                } else {
                    if (name === element.getText()) {
                        fmxParameterType = obj;
                        isClassOrInterface = true;
                    } 
                }   
            });
        }

        if(!isClassOrInterface){
            if (!this.fmxTypeMap.has(typeDeclaration)) {    
                // TODO refactor 
                if (isPrimitiveType(parameterTypeName)) {
                    fmxParameterType = this.createOrGetFamixPrimitiveType(parameterTypeName);
                } else {
                    fmxParameterType = new Famix.ParameterType();
                } 
    
                fmxParameterType.name = parameterTypeName;
                this.famixRep.addElement(fmxParameterType);
                this.fmxTypeMap.set(typeDeclaration, fmxParameterType);
                this.fmxElementObjectMap.set(fmxParameterType,typeParameterDeclaration);
            }
            else {
                const result = this.fmxTypeMap.get(typeDeclaration);
                if (result) {
                    fmxParameterType = result;
                } else {
                    throw new Error(`Famix type ${typeDeclaration} is not found in the Type map.`);
                }
            }
        }
        if (!fmxParameterType) {
            throw new Error(`fmxParameterType was undefined for parameterTypeName ${parameterTypeName}`);
        }
        return fmxParameterType;
    }

    /**
     * Creates a Famix variable
     * @param variable A variable
     * @returns The Famix model of the variable
     */
    public createOrGetFamixVariable(variable: VariableDeclaration): Famix.Variable {
        if (this.fmxVariableMap.has(variable)) {
            const rVariable = this.fmxVariableMap.get(variable);
            if (rVariable) { 
               return rVariable;
            } else {
                throw new Error(`Famix parameter ${variable.getName()} is not found in the variable map.`);
            }
        }
        const fmxVariable = new Famix.Variable();
    
        let variableTypeName = this.UNKNOWN_VALUE;
        try {
            variableTypeName = variable.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for variable: ${variable.getName()}. Continuing...`);
        }
    
        const fmxType = this.createOrGetFamixType(variableTypeName, variable.getType(), variable);
        fmxVariable.declaredType = fmxType;
        fmxVariable.name = variable.getName();
        initFQN(variable, fmxVariable);
        this.makeFamixIndexFileAnchor(variable, fmxVariable);
    
        this.famixRep.addElement(fmxVariable);
    
        this.fmxElementObjectMap.set(fmxVariable,variable);
        this.fmxVariableMap.set(variable, fmxVariable);
    
        return fmxVariable;
    }

    /**
     * Creates a Famix enum
     * @param enumEntity An enum
     * @returns The Famix model of the enum
     */
    public createOrGetFamixEnum(enumEntity: EnumDeclaration): Famix.Enum {
        if (this.fmxEnumMap.has(enumEntity)) {
            const rEnum = this.fmxEnumMap.get(enumEntity);
            if (rEnum) { 
               return rEnum;
            } else {
                throw new Error(`Famix enum ${enumEntity.getName()} is not found in the enum map.`);
            }
        }
        const fmxEnum = new Famix.Enum();
        fmxEnum.name = enumEntity.getName();
        initFQN(enumEntity, fmxEnum);
        this.makeFamixIndexFileAnchor(enumEntity, fmxEnum);

        this.famixRep.addElement(fmxEnum);

        this.fmxElementObjectMap.set(fmxEnum,enumEntity);
        this.fmxEnumMap.set(enumEntity, fmxEnum);

        return fmxEnum;
    }

    /**
     * Creates a Famix enum value
     * @param enumMember An enum member
     * @returns The Famix model of the enum member
     */
    public createFamixEnumValue(enumMember: EnumMember): Famix.EnumValue {
        const fmxEnumValue = new Famix.EnumValue();

        let enumValueTypeName = this.UNKNOWN_VALUE;
        try {
            enumValueTypeName = enumMember.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for enum value: ${enumMember.getName()}. Continuing...`);
        }

        const fmxType = this.createOrGetFamixType(enumValueTypeName, enumMember.getType(), enumMember);
        fmxEnumValue.declaredType = fmxType;
        fmxEnumValue.name = enumMember.getName();
        initFQN(enumMember, fmxEnumValue);
        this.makeFamixIndexFileAnchor(enumMember, fmxEnumValue);

        this.famixRep.addElement(fmxEnumValue);

        this.fmxElementObjectMap.set(fmxEnumValue,enumMember);

        return fmxEnumValue;
    }

    /**
     * Creates or gets a Famix decorator
     * @param decorator A decorator
     * @param decoratedEntity A class, a method, a parameter or a property
     * @returns The Famix model of the decorator
     */
    public createOrGetFamixDecorator(decorator: Decorator, decoratedEntity: ClassDeclaration | MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ParameterDeclaration | PropertyDeclaration): Famix.Decorator {
        const fmxDecorator = new Famix.Decorator();
        const decoratorName = "@" + decorator.getName();
        const decoratorExpression = decorator.getText().substring(1);

        fmxDecorator.name = decoratorName;
        fmxDecorator.decoratorExpression = decoratorExpression;
        const decoratedEntityFullyQualifiedName = FQNFunctions.getFQN(decoratedEntity);
        const fmxDecoratedEntity = this.famixRep.getFamixEntityByFullyQualifiedName(decoratedEntityFullyQualifiedName) as Famix.NamedEntity;
        fmxDecorator.decoratedEntity = fmxDecoratedEntity;
        initFQN(decorator, fmxDecorator);
        this.makeFamixIndexFileAnchor(decorator, fmxDecorator);

        this.famixRep.addElement(fmxDecorator);

        this.fmxElementObjectMap.set(fmxDecorator,decorator);

        return fmxDecorator;
    }

    /**
     * Creates a Famix comment
     * @param comment A comment
     * @param fmxScope The Famix model of the comment's container
     * @param isJSDoc A boolean indicating if the comment is a JSDoc
     * @returns The Famix model of the comment
     */
    public createFamixComment(comment: CommentRange, fmxScope: Famix.NamedEntity, isJSDoc: boolean): Famix.Comment {
        logger.debug(`> NOTE: creating comment ${comment.getText()} in scope ${fmxScope.name}.`);
        const fmxComment = new Famix.Comment();
        fmxComment.container = fmxScope;  // adds comment to the container's comments collection
        fmxComment.isJSDoc = isJSDoc;

        this.makeFamixIndexFileAnchor(comment, fmxComment);

        this.famixRep.addElement(fmxComment);

        this.fmxElementObjectMap.set(fmxComment,comment);

        return fmxComment;
    }

    /**
     * Creates or gets a Famix type
     * @param typeName A type name
     * @param element A ts-morph element
     * @returns The Famix model of the type
     */
    public createOrGetFamixType(typeNameArg: string, tsMorphType: Type | undefined, element: TSMorphTypeDeclaration): Famix.Type {
        logger.debug(`Creating (or getting) type: '${tsMorphType!.getText() || "undefined"}' of element: '${element?.getText().slice(0, 50)}...' of kind: ${element?.getKindName()}`);

        // convert type to name (workaround for unique symbole primitive type)
        const typeName = tsMorphType && getPrimitiveTypeName(tsMorphType) || typeNameArg;

        if (isPrimitiveType(typeName)) {
            return this.createOrGetFamixPrimitiveType(typeName);
        }

        if (element.isKind(SyntaxKind.MethodSignature) || element.isKind(SyntaxKind.MethodDeclaration)) {
            const methodFQN = FQNFunctions.getFQN(element);
            const returnTypeFQN = `${methodFQN.replace(/\[Method(Signature|Declaration)\]$/, '')}[ReturnType]`;
            
            // Check if we already have this return type in the repository
            const existingType = this.famixRep.getFamixEntityByFullyQualifiedName(returnTypeFQN);
            if (existingType) {
                // console.log(`Found existing return type with FQN: ${returnTypeFQN}`);
                return existingType as Famix.Type;
            }
    
            // console.log(`Creating return type with distinct FQN: ${returnTypeFQN}`);
            const fmxType = new Famix.Type();
            fmxType.name = typeName;
            fmxType.fullyQualifiedName = returnTypeFQN;
            
            // Set container (same as method's container)
            const methodAncestor = Helpers.findTypeAncestor(element);
            if (methodAncestor) {
                const ancestorFQN = FQNFunctions.getFQN(methodAncestor);
                const ancestor = this.famixRep.getFamixEntityByFullyQualifiedName(ancestorFQN) as Famix.ContainerEntity;
                if (ancestor) {
                    fmxType.container = ancestor;
                }
            }
    
            this.famixRep.addElement(fmxType);
            this.fmxTypeMap.set(element, fmxType);
            this.fmxElementObjectMap.set(fmxType, element);
            return fmxType;
        }

        const isParametricType =
            (element instanceof ClassDeclaration && element.getTypeParameters().length > 0) ||
            (element instanceof InterfaceDeclaration && element.getTypeParameters().length > 0);
            
        if (isParametricType) {
            return this.createOrGetFamixParametricType(typeName, element as TSMorphParametricType);
        }
    
        if (!this.fmxTypeMap.has(element)) {
            // console.log('Type not found in map, creating new'); 
            let ancestor: Famix.ContainerEntity | undefined;    
            if (element) {
                const typeAncestor = Helpers.findTypeAncestor(element);
                // console.log(`Type ancestor found: ${typeAncestor?.getKindName()}`);
    
                if (typeAncestor) {
                    const ancestorFullyQualifiedName = FQNFunctions.getFQN(typeAncestor);
                    // console.log(`Ancestor FQN: ${ancestorFullyQualifiedName}`);
                    ancestor = this.famixRep.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
                    if (!ancestor) {
                        ancestor = this.createOrGetFamixType(typeAncestor.getText(), typeAncestor.getType(), typeAncestor as TSMorphTypeDeclaration);
                        // console.log('Ancestor not found in repo, creating it');
                    } else {
                        console.log(`Found ancestor in famixRep: ${ancestor.fullyQualifiedName}`);
                    }
                } else {
                    console.log(`No type ancestor found for ${typeName} - proceeding without container`);
                }
            }
    
            const fmxType = new Famix.Type();
            fmxType.name = typeName;
            // console.log(`Created new type with name: ${typeName}`);    
            if (ancestor) {
                fmxType.container = ancestor;
            } else {
                throw new Error(`Ancestor not found for type ${typeName}.`);
            }
    
            initFQN(element, fmxType);
            // console.log(`Type FQN after init: ${fmxType.fullyQualifiedName}`);
            this.makeFamixIndexFileAnchor(element, fmxType);
            this.famixRep.addElement(fmxType);
            // console.log('Added type to repository');
            this.fmxTypeMap.set(element, fmxType);
        } else {
            const fmxType = this.fmxTypeMap.get(element);
            if (!fmxType) {
                throw new Error(`Famix type ${typeName} is not found in the Type map.`);
            }
            return fmxType;
        }
    
        const fmxType = this.fmxTypeMap.get(element)!;
        this.fmxElementObjectMap.set(fmxType, element);
        return fmxType;
    }

    /**
     * Creates or gets a Famix type that is parametric
     * @param typeName A type name
     * @param element A ts-morph element
     * @returns The Famix model of the parameter type
     */
    createOrGetFamixParametricType(typeName: string, element: TSMorphParametricType): Famix.Type {

        if (this.fmxTypeMap.has(element) === true) {
            const result = this.fmxTypeMap.get(element);
            if (result) {
                return result;
            } else {
                throw new Error(`Famix type ${typeName} is not found (undefined) in the Type map.`);
            }
        }

        // A parametric type is a type that has type parameters, e.g., List<T>
        // In TS it can be a class, an interface, a function, an arrow function, or a method

        // create the Famix Parametric Type (maybe it's just an Interface, etc.)
        let fmxType: Famix.Type;

        if (element instanceof ClassDeclaration) {
            fmxType = new Famix.ParametricClass();
        } else if (element instanceof InterfaceDeclaration) {
            fmxType = new Famix.ParametricInterface();
        }
        // functions and methods are not types 
        // else if (element instanceof FunctionDeclaration) {
        //     fmxType = new Famix.ParametricFunction();
        // } else if (element instanceof ArrowFunction) {
        //     fmxType = new Famix.ParametricArrowFunction();
        // } else if (element instanceof MethodDeclaration) {
        //     fmxType = new Famix.ParametricMethod();
        // } 
        else {
            throw new Error(`Element is not a class, interface, function, arrow function, or method.`);
        }

        // const parameters = element.getTypeParameters();

        // // for each parameter, getOrCreate the FamixParameterType
        // for (const parameter of parameters) {
        //     this.createOrGetFamixParameterType(parameter.getName(), parameter);
        // }

        // // TODO: the following code is not correct, it is just a placeholder
        // const parameterTypeNames = typeName.substring(typeName.indexOf("<") + 1, typeName.indexOf(">"))
        //     .split(",").map(s => s.trim());
        // const baseTypeName = typeName.substring(0, typeName.indexOf("<")).trim();
        // parameterTypeNames.forEach(parameterTypeName => {
        //     const fmxParameterType = this.createOrGetFamixParameterType(parameterTypeName, element);
        //     (fmxType as Famix.ParameterType).addArgument(fmxParameterType);
        // });
        // const fmxBaseType = this.createOrGetFamixType(baseTypeName, element);

        // (fmxType as Famix.ParameterType).baseType = fmxBaseType;

        fmxType.name = typeName;
        initFQN(element, fmxType);
        this.famixRep.addElement(fmxType);
        this.fmxTypeMap.set(element, fmxType);
        return fmxType;
    }

    /**
     * Creates a type for a parameter in a parametric type, e.g., T in List<T>
     * @param parameterTypeName 
     * @param element the TypeScript element (TSMorphParametricType) that the type is associated with
     * @returns 
     */
    // createOrGetFamixParameterType(parameterTypeName: string, element: ParameterDeclaration) {
    //     if (this.fmxTypeMap.has(element)) {
    //         return this.fmxTypeMap.get(element) as Famix.ParameterType;
    //     }

    //     // determine if element is a 
    //     const fmxType = new Famix.ParameterType();
    //     // const parameterTypeNames = typeName.substring(typeName.indexOf("<") + 1, typeName.indexOf(">"))
    //     //     .split(",").map(s => s.trim());
    //     // const baseTypeName = typeName.substring(0, typeName.indexOf("<")).trim();
    //     // parameterTypeNames.forEach(parameterTypeName => {
    //     //     const fmxParameterType = this.createOrGetFamixParameterType(parameterTypeName, element);
    //     //     (fmxType as Famix.ParameterType).addArgument(fmxParameterType);
    //     // });
    //     const fmxBaseType = this.createOrGetFamixType(baseTypeName, element);
    //     (fmxType as Famix.ParameterType).baseType = fmxBaseType;
    //     initFQN(element, fmxType);
    //     this.famixRep.addElement(fmxType);
    //     this.fmxTypeMap.set(element, fmxType);
    //     return fmxType;
    // }

    /**
     * Creates or gets a Famix primitive type
     * @param typeName A type name
     * @returns The Famix model of the primitive type
     */
    createOrGetFamixPrimitiveType(typeName: string): Famix.PrimitiveType {
        let fmxType: Famix.PrimitiveType = new Famix.PrimitiveType();
        if (!this.fmxPrimitiveTypeMap.has(typeName)) {
            fmxType = new Famix.PrimitiveType();
            fmxType.isStub = true;
            fmxType.name = typeName;
            fmxType.fullyQualifiedName = typeName + "[PrimitiveType]";
            this.fmxPrimitiveTypeMap.set(typeName, fmxType);
            this.famixRep.addElement(fmxType);
        } else {
            fmxType = this.fmxPrimitiveTypeMap.get(typeName) as Famix.PrimitiveType;
        }
        return fmxType;
    }

    /**
     * Creates a Famix access
     * @param node A node
     * @param id An id of a parameter, a variable, a property or an enum member
     */
    public createFamixAccess(node: Identifier, id: number): void {
        const fmxVar = this.famixRep.getFamixEntityById(id) as Famix.StructuralEntity;
        if (!fmxVar) {
            throw new Error(`Famix entity with id ${id} not found, for node ${node.getText()} in ${node.getSourceFile().getBaseName()} at line ${node.getStartLineNumber()}.`);
        }
    
        logger.debug(`Creating FamixAccess. Node: [${node.getKindName()}] '${node.getText()}' at line ${node.getStartLineNumber()} in ${node.getSourceFile().getBaseName()}, id: ${id} refers to fmxVar '${fmxVar.fullyQualifiedName}'.`);
    
        const nodeReferenceAncestor = Helpers.findAncestor(node);
        if (!nodeReferenceAncestor) {
            logger.error(`No ancestor found for node '${node.getText()}'`);
            return;
        }
    
        const ancestorFullyQualifiedName = FQNFunctions.getFQN(nodeReferenceAncestor);
        const accessor = this.famixRep.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
        if (!accessor) {
            logger.error(`Ancestor ${ancestorFullyQualifiedName} of kind ${nodeReferenceAncestor.getKindName()} not found.`);
            return; // Bail out for now
        } else {
            logger.debug(`Found accessor to be ${accessor.fullyQualifiedName}.`);
        }
    
        // Ensure accessor is a method, function, script, or module
        if (!(accessor instanceof Famix.Method) && !(accessor instanceof Famix.ArrowFunction) && !(accessor instanceof Famix.Function) && !(accessor instanceof Famix.ScriptEntity) && !(accessor instanceof Famix.Module)) {
            logger.error(`Accessor ${accessor.fullyQualifiedName} is not a method, function, etc.`);
            return;
        }
    
        // Avoid duplicates
        const foundAccess = this.famixRep.getFamixAccessByAccessorAndVariable(accessor, fmxVar);
        if (foundAccess) {
            logger.debug(`FamixAccess already exists for accessor ${accessor.fullyQualifiedName} and variable ${fmxVar.fullyQualifiedName}.`);
            return;
        }
    
        const fmxAccess = new Famix.Access();
        fmxAccess.accessor = accessor;
        fmxAccess.variable = fmxVar;
        this.famixRep.addElement(fmxAccess);
        this.fmxElementObjectMap.set(fmxAccess, node);
        logger.debug(`Created access: ${accessor.fullyQualifiedName} -> ${fmxVar.fullyQualifiedName}`);
    }

    /**
     * Creates a Famix invocation
     * @param nodeReferringToInvocable A node
     * @param invocable A method or a function
     * @param id The id of the method or the function
     */
    public createFamixInvocation(nodeReferringToInvocable: Identifier, invocable: InvocableType, id: number): void {
        const fmxInvocable = this.famixRep.getFamixEntityById(id) as Famix.BehavioralEntity;
        // since the node is in the AST, we need to find the ancestor that is in the Famix model
        const containerOfNode = Helpers.findAncestor(nodeReferringToInvocable);
        logger.debug(`Found container (ancestor) ${containerOfNode.getKindName()} for AST node ${nodeReferringToInvocable.getText()}.`);
        const containerFQN = FQNFunctions.getFQN(containerOfNode);
        logger.debug(`Found containerFQN ${containerFQN}.`);
        let sender = this.famixRep.getFamixEntityByFullyQualifiedName(containerFQN) as Famix.ContainerEntity;
        logger.debug(`Found a sender that matches ${sender.fullyQualifiedName}.`);
        if (sender instanceof Famix.Type) {
            // TODO this might be an error in getFamixEntityByFullyQualifiedName
            logger.debug(`Oops! Sender is a type, which is not valid for an Invocation. Trying to find a container for ${sender.fullyQualifiedName}.`);
            const senderContainer = sender.container;
            if (senderContainer) {
                sender = senderContainer;
            }
        }
        const receiverFullyQualifiedName = FQNFunctions.getFQN(invocable.getParent());
        const receiver = this.famixRep.getFamixEntityByFullyQualifiedName(receiverFullyQualifiedName) as Famix.NamedEntity;

        const fmxInvocation = new Famix.Invocation();
        fmxInvocation.sender = sender;
        fmxInvocation.receiver = receiver;
        fmxInvocation.addCandidate(fmxInvocable);
        fmxInvocation.signature = fmxInvocable.signature;

        this.famixRep.addElement(fmxInvocation);

        this.fmxElementObjectMap.set(fmxInvocation,nodeReferringToInvocable);
    }

    /**
     * Creates a Famix inheritance
     * @param baseClassOrInterface A class or an interface (subclass)
     * @param inheritedClassOrInterface The inherited class or interface (superclass)
     */
    public createOrGetFamixInheritance(baseClassOrInterface: ClassDeclaration | InterfaceDeclaration, inheritedClassOrInterface: ClassDeclaration | InterfaceDeclaration | ExpressionWithTypeArguments): void {
        logger.debug(`Creating FamixInheritance for ${baseClassOrInterface.getText()} and ${inheritedClassOrInterface.getText()} [${inheritedClassOrInterface.constructor.name}].`);
        const fmxInheritance = new Famix.Inheritance();

        let subClass: Famix.Class | Famix.Interface | undefined;
        if (baseClassOrInterface instanceof ClassDeclaration) {
            subClass = this.createOrGetFamixClass(baseClassOrInterface);
        } else {
            subClass = this.createOrGetFamixInterface(baseClassOrInterface);
        }

        if (!subClass) {
            throw new Error(`Subclass ${baseClassOrInterface} not found in Class or Interface maps.`);
        }

        let superClass: Famix.Class | Famix.Interface | undefined;

        if (inheritedClassOrInterface instanceof ClassDeclaration) {
            superClass = this.createOrGetFamixClass(inheritedClassOrInterface);
        } else if (inheritedClassOrInterface instanceof InterfaceDeclaration) {
            superClass = this.createOrGetFamixInterface(inheritedClassOrInterface);
        } else  {
            // inheritedClassOrInterface instanceof ExpressionWithTypeArguments
            // must determine if inheritedClassOrInterface is a class or an interface
            // then find the declaration, else it's a stub

            const heritageClause = inheritedClassOrInterface.getParent();
            if (heritageClause instanceof HeritageClause) {
                // cases: 1) class extends class, 2) class implements interface, 3) interface extends interface

                // class extends class
                if (heritageClause.getText().startsWith("extends") && baseClassOrInterface instanceof ClassDeclaration) {
                    const classDeclaration = getInterfaceOrClassDeclarationFromExpression(inheritedClassOrInterface);
                    if (classDeclaration !== undefined && classDeclaration instanceof ClassDeclaration) {
                        superClass = this.createOrGetFamixClass(classDeclaration);
                    } else {
                        logger.error(`Class declaration not found for ${inheritedClassOrInterface.getText()}.`);
                        superClass = this.createOrGetFamixClassStub(inheritedClassOrInterface);
                    }
                } 
                else if (heritageClause.getText().startsWith("implements") && baseClassOrInterface instanceof ClassDeclaration // class implements interface
                    || (heritageClause.getText().startsWith("extends") && baseClassOrInterface instanceof InterfaceDeclaration)) { // interface extends interface

                    const interfaceOrClassDeclaration = getInterfaceOrClassDeclarationFromExpression(inheritedClassOrInterface);
                    if (interfaceOrClassDeclaration !== undefined && interfaceOrClassDeclaration instanceof InterfaceDeclaration) {
                        superClass = this.createOrGetFamixInterface(interfaceOrClassDeclaration);
                    } else {
                        logger.error(`Interface declaration not found for ${inheritedClassOrInterface.getText()}.`);
                        superClass = this.createOrGetFamixInterfaceStub(inheritedClassOrInterface);
                    }
                } else {
                    // throw new Error(`Parent of ${inheritedClassOrInterface.getText()} is not a class or an interface.`);
                    logger.error(`Parent of ${inheritedClassOrInterface.getText()} is not a class or an interface.`);
                    superClass = this.createOrGetFamixInterfaceStub(inheritedClassOrInterface);
                }
            } else {
                throw new Error(`Heritage clause not found for ${inheritedClassOrInterface.getText()}.`);
            }

        }

        this.fmxElementObjectMap.set(superClass, inheritedClassOrInterface);

        this.makeFamixIndexFileAnchor(inheritedClassOrInterface, superClass);

        this.famixRep.addElement(superClass);

        fmxInheritance.subclass = subClass;
        fmxInheritance.superclass = superClass;

        this.famixRep.addElement(fmxInheritance);
        // no FQN for inheritance

        // We don't map inheritance to the source code element because there are two elements (super, sub)
        // this.fmxElementObjectMap.set(fmxInheritance, null);

    }
    createOrGetFamixClassStub(unresolvedInheritedClass: ExpressionWithTypeArguments): Famix.Class {
        // make a FQN for the stub
        const fqn = FQNFunctions.getFQNUnresolvedInheritedClassOrInterface(unresolvedInheritedClass);
        logger.debug(`createOrGetFamixClassStub: fqn: ${fqn}`);
        const fmxClass = this.famixRep.getFamixEntityByFullyQualifiedName(fqn) as Famix.Class;
        if (fmxClass) {
            return fmxClass;
        } else {
            const stub = new Famix.Class();
            stub.name = unresolvedInheritedClass.getText();
            stub.isStub = true;
            stub.fullyQualifiedName = fqn;
            this.famixRep.addElement(stub);
            this.fmxElementObjectMap.set(stub, unresolvedInheritedClass);
            return stub;
        }
    }

    createOrGetFamixInterfaceStub(unresolvedInheritedInterface: ExpressionWithTypeArguments): Famix.Interface {
        // make a FQN for the stub
        const fqn = FQNFunctions.getFQNUnresolvedInheritedClassOrInterface(unresolvedInheritedInterface);
        logger.debug(`createOrGetFamixInterfaceStub: fqn: ${fqn}`);
        const fmxInterface = this.famixRep.getFamixEntityByFullyQualifiedName(fqn) as Famix.Interface;
        if (fmxInterface) {
            return fmxInterface;
        } else {
            const stub = new Famix.Interface();
            stub.name = unresolvedInheritedInterface.getText();
            stub.isStub = true;
            stub.fullyQualifiedName = fqn;
            this.famixRep.addElement(stub);
            this.fmxElementObjectMap.set(stub, unresolvedInheritedInterface);
            return stub;
        }
    }

    public createFamixImportClause(importedEntity: Famix.NamedEntity, importingEntity: Famix.Module) {
        const fmxImportClause = new Famix.ImportClause();
        fmxImportClause.importedEntity = importedEntity;
        fmxImportClause.importingEntity = importingEntity;
        importingEntity.addOutgoingImport(fmxImportClause);
        this.famixRep.addElement(fmxImportClause);
    }

    /**
     * Creates a Famix import clause
     * @param importClauseInfo The information needed to create a Famix import clause
     * @param importDeclaration The import declaration
     * @param importer A source file which is a module
     * @param moduleSpecifierFilePath The path of the module where the export declaration is
     * @param importElement The imported entity
     * @param isInExports A boolean indicating if the imported entity is in the exports
     * @param isDefaultExport A boolean indicating if the imported entity is a default export
     */
    public oldCreateOrGetFamixImportClause(importClauseInfo: {importDeclaration?: ImportDeclaration | ImportEqualsDeclaration, importerSourceFile: SourceFile, moduleSpecifierFilePath: string, importElement: ImportSpecifier | Identifier, isInExports: boolean, isDefaultExport: boolean}): void {
        const {importDeclaration, importerSourceFile: importer, moduleSpecifierFilePath, importElement, isInExports, isDefaultExport} = importClauseInfo;
        if (importDeclaration && this.fmxImportClauseMap.has(importDeclaration)) {
            const rImportClause = this.fmxImportClauseMap.get(importDeclaration);
            if (rImportClause) { 
                logger.debug(`Import clause ${importElement.getText()} already exists in map, skipping.`);
                return;
            } else {
                throw new Error(`Import clause ${importElement.getText()} is not found in the import clause map.`);
            }
        }
    
        logger.info(`creating a new FamixImportClause for ${importDeclaration?.getText()} in ${importer.getBaseName()}.`);
        const fmxImportClause = new Famix.ImportClause();
    
        let importedEntity: Famix.NamedEntity | Famix.StructuralEntity | undefined = undefined;
        let importedEntityName: string;
    
        const absolutePathProject = this.famixRep.getAbsolutePath();
        
        const absolutePath = path.normalize(moduleSpecifierFilePath);
        logger.debug(`createFamixImportClause: absolutePath: ${absolutePath}`);
        logger.debug(`createFamixImportClause: convertToRelativePath: ${this.convertToRelativePath(absolutePath, absolutePathProject)}`);
        const pathInProject: string = this.convertToRelativePath(absolutePath, absolutePathProject).replace(/\\/g, "/");
        logger.debug(`createFamixImportClause: pathInProject: ${pathInProject}`);
        let pathName = "{" + pathInProject + "}.";
        logger.debug(`createFamixImportClause: pathName: ${pathName}`);
    
        if (importDeclaration instanceof ImportDeclaration 
            && importElement instanceof ImportSpecifier) { 
                importedEntityName = importElement.getName();
            pathName = pathName + importedEntityName;
            if (isInExports) {
                importedEntity = this.famixRep.getFamixEntityByFullyQualifiedName(pathName) as Famix.NamedEntity;
                logger.debug(`Found exported entity: ${pathName}`);
            }
            if (importedEntity === undefined) {
                importedEntity = new Famix.NamedEntity();
                importedEntity.name = importedEntityName;
                if (!isInExports) {
                    importedEntity.isStub = true;
                }
                logger.debug(`Creating named entity ${importedEntityName} for ImportSpecifier ${importElement.getText()}`);
                initFQN(importElement, importedEntity);
                logger.debug(`Assigned FQN to entity: ${importedEntity.fullyQualifiedName}`);
                this.makeFamixIndexFileAnchor(importElement, importedEntity);
                this.famixRep.addElement(importedEntity);
                logger.debug(`Added entity to repository: ${importedEntity.fullyQualifiedName}`);
            }
        }
        else if (importDeclaration instanceof ImportEqualsDeclaration) {
            importedEntityName = importDeclaration?.getName();
            pathName = pathName + importedEntityName;
            importedEntity = new Famix.StructuralEntity();
            importedEntity.name = importedEntityName;
            initFQN(importDeclaration, importedEntity);
            logger.debug(`Assigned FQN to ImportEquals entity: ${importedEntity.fullyQualifiedName}`);
            this.makeFamixIndexFileAnchor(importElement, importedEntity);
            const anyType = this.createOrGetFamixType('any', undefined, importDeclaration);
            (importedEntity as Famix.StructuralEntity).declaredType = anyType;
        } else {  
            importedEntityName = importElement.getText();
            pathName = pathName + (isDefaultExport ? "defaultExport" : "namespaceExport");
            importedEntity = new Famix.NamedEntity();
            importedEntity.name = importedEntityName;
            initFQN(importElement, importedEntity);
            logger.debug(`Assigned FQN to default/namespace entity: ${importedEntity.fullyQualifiedName}`);
            this.makeFamixIndexFileAnchor(importElement, importedEntity);
        }
        if (!isInExports) {
            this.famixRep.addElement(importedEntity);
            logger.debug(`Added non-exported entity to repository: ${importedEntity.fullyQualifiedName}`);
        }
        const importerFullyQualifiedName = FQNFunctions.getFQN(importer);
        const fmxImporter = this.famixRep.getFamixEntityByFullyQualifiedName(importerFullyQualifiedName) as Famix.Module;
        fmxImportClause.importingEntity = fmxImporter;
        fmxImportClause.importedEntity = importedEntity;
        if (importDeclaration instanceof ImportEqualsDeclaration) {
            fmxImportClause.moduleSpecifier = importDeclaration?.getModuleReference().getText() as string;
        } else {
            fmxImportClause.moduleSpecifier = importDeclaration?.getModuleSpecifierValue() as string;
        }
    
        logger.debug(`ImportClause: ${fmxImportClause.importedEntity?.name} (type=${Helpers.getSubTypeName(fmxImportClause.importedEntity)}) imported by ${fmxImportClause.importingEntity?.name}`);
    
        fmxImporter.addOutgoingImport(fmxImportClause);
        this.famixRep.addElement(fmxImportClause);
    
        if (importDeclaration) {
            this.fmxElementObjectMap.set(fmxImportClause, importDeclaration);
            this.fmxImportClauseMap.set(importDeclaration, fmxImportClause);
        }
    }

    /**
     * Creates a Famix Arrow Function
     * @param arrowExpression An Expression
     * @returns The Famix model of the variable
     */
    public createOrGetFamixArrowFunction(arrowExpression: Expression, currentCC: { [key: string]: number } ): Famix.ArrowFunction | Famix.ParametricArrowFunction {
        
        let fmxArrowFunction: Famix.ArrowFunction | Famix.ParametricArrowFunction;
        const functionFullyQualifiedName = FQNFunctions.getFQN(arrowExpression);

        if (!this.fmxFunctionAndMethodMap.has(functionFullyQualifiedName)) {

            const arrowFunction = arrowExpression.asKindOrThrow(SyntaxKind.ArrowFunction);

            const isGeneric = arrowFunction.getTypeParameters().length > 0;

            if (isGeneric) {
                fmxArrowFunction = new Famix.ParametricArrowFunction();
            }
            else {
                fmxArrowFunction = new Famix.ArrowFunction();
            }

            // Get the parent of the arrow function (the variable declaration)
            const parent = arrowFunction.getParentIfKind(SyntaxKind.VariableDeclaration);
            let functionName = '(NO_NAME)';

            if (parent && parent instanceof VariableDeclaration) {
                // Get the name of the variable
                functionName = parent.getName();
            }

            if (functionName) {
                fmxArrowFunction.name = functionName;
            }
            else {
                fmxArrowFunction.name = "anonymous";
            }

            // Signature of an arrow function is (parameters) => return_type
            const parametersSignature = arrowFunction.getParameters().map(p => p.getText()).join(", ");
            const returnTypeSignature = arrowFunction.getReturnType().getText();
            fmxArrowFunction.signature = `(${parametersSignature}) => ${returnTypeSignature}`;
            fmxArrowFunction.cyclomaticComplexity = currentCC[fmxArrowFunction.name];

            let functionTypeName = this.UNKNOWN_VALUE;
            try {
                functionTypeName = arrowFunction.getReturnType().getText().trim();
            } catch (error) {
                logger.error(`> WARNING: got exception ${error}. Failed to get usable name for return type of function: ${functionName}. Continuing...`);
            }

            const fmxType = this.createOrGetFamixType(functionTypeName, arrowFunction.getReturnType(), arrowFunction as unknown as FunctionDeclaration);
            fmxArrowFunction.declaredType = fmxType;
            fmxArrowFunction.numberOfLinesOfCode = arrowFunction.getEndLineNumber() - arrowFunction.getStartLineNumber();
            const parameters = arrowFunction.getParameters();
            fmxArrowFunction.numberOfParameters = parameters.length;
            fmxArrowFunction.numberOfStatements = arrowFunction.getStatements().length;
            initFQN(arrowExpression as unknown as TSMorphObjectType, fmxArrowFunction);
            this.makeFamixIndexFileAnchor(arrowExpression as unknown as TSMorphObjectType, fmxArrowFunction);
            this.famixRep.addElement(fmxArrowFunction);
            this.fmxElementObjectMap.set(fmxArrowFunction,arrowFunction as unknown as TSMorphObjectType);
            this.fmxFunctionAndMethodMap.set(functionFullyQualifiedName, fmxArrowFunction);
        } else {
            fmxArrowFunction = this.fmxFunctionAndMethodMap.get(functionFullyQualifiedName) as Famix.ArrowFunction;
        }

        return fmxArrowFunction;
    }

    /**
     * Creates a Famix concretisation
     * @param cls A class
     * @returns The Famix model of the concretisation
     */
    public createFamixConcretisation(conEntity : Famix.ParametricClass | Famix.ParametricInterface | Famix.ParametricFunction | Famix.ParametricMethod ,genEntity : Famix.ParametricClass | Famix.ParametricInterface | Famix.ParametricFunction | Famix.ParametricMethod): Famix.Concretisation {
        
        const fmxConcretisation : Famix.Concretisation = new Famix.Concretisation();              
        
        fmxConcretisation.concreteEntity = conEntity;
        fmxConcretisation.genericEntity = genEntity;
        // this.fmxElementObjectMap.set(fmxConcretisation,null);
        this.famixRep.addElement(fmxConcretisation);
        // const parameterConcretisation = this.createFamixParameterConcretisation(fmxConcretisation);
            
        return fmxConcretisation;
    }

    /**
     * Creates a Famix concretisation
     * @param concretisation A FamixConcretisation
     * @returns The Famix model of the ParameterConcrestisation
     */
    public createFamixParameterConcretisation(concretisation: Famix.Concretisation): Famix.ParameterConcretisation | undefined{
        const conClass = concretisation.concreteEntity;
        const genClass = concretisation.genericEntity;
        logger.debug(`Creating parameter concretisation between ${conClass.fullyQualifiedName} and ${genClass.fullyQualifiedName}`);
        const parameterConcretisations = this.famixRep._getAllEntitiesWithType("ParameterConcretisation") as Set<Famix.ParameterConcretisation>;
        const concreteParameters = conClass.concreteParameters;
        const genericParameters = genClass.genericParameters;
        
        const conClassTypeParametersIterator = concreteParameters.values();
        const genClassTypeParametersIterator = genericParameters.values();
        let fmxParameterConcretisation : Famix.ParameterConcretisation | undefined = undefined;

        for (let i = 0; i < genericParameters.size; i++) {
            const conClassTypeParameter = conClassTypeParametersIterator.next().value as Famix.ParameterType;
            const genClassTypeParameter = genClassTypeParametersIterator.next().value as Famix.ParameterType;
            let createParameterConcretisation : boolean = true;
            if(conClassTypeParameter && genClassTypeParameter && conClassTypeParameter.name != genClassTypeParameter.name){
                parameterConcretisations.forEach((param : Famix.ParameterConcretisation) => {
                    if (conClassTypeParameter.name == param.concreteParameter.name && genClassTypeParameter.name == param.genericParameter.name) {
                        createParameterConcretisation = false;
                        fmxParameterConcretisation = param;
                    }
                });
                if (createParameterConcretisation) {
                    fmxParameterConcretisation = new Famix.ParameterConcretisation();
                    fmxParameterConcretisation.genericParameter = genClassTypeParameter;
                    fmxParameterConcretisation.concreteParameter = conClassTypeParameter;
                    fmxParameterConcretisation.addConcretisation(concretisation);
                    // this.fmxElementObjectMap.set(fmxParameterConcretisation,null);
                } else {
                    if (!fmxParameterConcretisation) {
                        throw new Error(`fmxParameterConcretisation was undefined for concretisation with generic parameter ${genClassTypeParameter.name} and concrete parameter ${conClassTypeParameter.name}`);
                    }
                    fmxParameterConcretisation.addConcretisation(concretisation);
                }
                this.famixRep.addElement(fmxParameterConcretisation);
            }
        }
        if (!fmxParameterConcretisation) {
            logger.error(`fmxParameterConcretisation was undefined for concretisation with concrete entity ${conClass.fullyQualifiedName} and generic entity ${genClass.fullyQualifiedName}`);
        }
        return fmxParameterConcretisation;

    }

    /**
     * Creates a Famix concretisation between two classes or two interfaces
     * @param element A class or an Interface
     */
    public createFamixConcretisationClassOrInterfaceSpecialisation(element: ClassDeclaration | InterfaceDeclaration){
        
        const superEntity = element.getExtends();
        let superEntityArray;
        if (superEntity){
            superEntityArray = Array.isArray(superEntity) ? superEntity : [superEntity];
        }
        if (superEntityArray && superEntityArray.length > 0) {
            superEntityArray.forEach(entity => {
                let entityIsGeneric;
                const superEntitySymbol = entity.getExpression().getSymbolOrThrow();
                let superEntityDeclaration;
                if (superEntity instanceof ExpressionWithTypeArguments) {
                    superEntityDeclaration = superEntitySymbol.getDeclarations()[0].asKind(ts.SyntaxKind.ClassDeclaration);
                } else {
                    superEntityDeclaration = superEntitySymbol.getDeclarations()[0].asKind(ts.SyntaxKind.InterfaceDeclaration);
                }
                if (superEntityDeclaration) {
                    entityIsGeneric = superEntityDeclaration.getTypeParameters().length > 0;
                }
                if (entityIsGeneric) {
                    let EntityDeclaration;
                    let genEntity;
                    if (superEntity instanceof ExpressionWithTypeArguments) {
                        EntityDeclaration = entity.getExpression().getSymbol()?.getDeclarations()[0] as ClassDeclaration;
                        genEntity = this.createOrGetFamixClass(EntityDeclaration) as Famix.ParametricClass;
                    } else {
                        EntityDeclaration = entity.getExpression().getSymbol()?.getDeclarations()[0] as InterfaceDeclaration;
                        genEntity = this.createOrGetFamixInterface(EntityDeclaration) as Famix.ParametricInterface;
                    }
                    const genParams = EntityDeclaration.getTypeParameters().map((param) => param.getText());
                    const args = element.getHeritageClauses()[0].getTypeNodes()[0].getTypeArguments()
                    const conParams = element.getHeritageClauses()[0].getTypeNodes()[0].getTypeArguments().map((param) => param.getText());
                    if (!Helpers.arraysAreEqual(conParams,genParams)) {
                        const conEntity = this.createOrGetFamixConcreteElement(genEntity,EntityDeclaration,args);
                        const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation") as Set<Famix.Concretisation>;
                        let createConcretisation : boolean = true;
                        concretisations.forEach((conc : Famix.Concretisation) => {
                            if (genEntity.fullyQualifiedName == conc.genericEntity.fullyQualifiedName && conc.concreteEntity.fullyQualifiedName == conEntity.fullyQualifiedName){
                                createConcretisation = false;
                            }
                        });
            
                        if (createConcretisation) {
                            const fmxConcretisation : Famix.Concretisation = this.createFamixConcretisation(conEntity,genEntity);
                        }
                    }
                }
            });
        }
        // TODO: This function seems unfinished
    }    
    

    /**
     * Creates a Famix concretisation between a class and its instanciations
     * @param cls A class
     */
    public createFamixConcretisationGenericInstantiation(cls: ClassDeclaration){
       
        const isGeneric = cls.getTypeParameters().length > 0;
        if (isGeneric) {
            const instances = cls.getSourceFile().getDescendantsOfKind(ts.SyntaxKind.NewExpression)
                .filter(newExpr => {
                    const expression = newExpr.getExpression();
                    return expression.getText() === cls.getName();
            });

            instances.forEach(instance => {
                const instanceIsGeneric = instance.getTypeArguments().length > 0;
                if (instanceIsGeneric) {
                    const conParams = instance.getTypeArguments().map((param) => param.getText());
                    const genEntity = this.createOrGetFamixClass(cls) as Famix.ParametricClass;
                    const genParams = cls.getTypeParameters().map((param) => param.getText());
                    if (!Helpers.arraysAreEqual(conParams,genParams)) {
                        const conEntity = this.createOrGetFamixConcreteElement(genEntity,cls,instance.getTypeArguments());
                        const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation") as Set<Famix.Concretisation>;
                        let createConcretisation : boolean = true;
                        concretisations.forEach((conc : Famix.Concretisation) => {
                            if (genEntity.fullyQualifiedName == conc.genericEntity.fullyQualifiedName && conc.concreteEntity.fullyQualifiedName == conEntity.fullyQualifiedName){
                                createConcretisation = false;
                            }
                        });
            
                        if (createConcretisation) {
                            const fmxConcretisation : Famix.Concretisation = this.createFamixConcretisation(conEntity,genEntity);
                        }
                    }
                }
            })
        }
        // TODO: This function seems unfinished
    }

    /**
     * Creates a Famix concretisation between a class and its instanciations
     * @param func A function
     */
    public createFamixConcretisationFunctionInstantiation(element: FunctionDeclaration | MethodDeclaration){
        const isGeneric = element.getTypeParameters().length > 0;
        if (isGeneric) {
            const genParams = element.getTypeParameters().map(param => param.getText());
            const uses = element.findReferencesAsNodes();    
            uses.forEach(usage => {
                let currentNode: TsMorphNode | undefined = usage;

                while (currentNode) {
                    if (currentNode.getKind() === SyntaxKind.CallExpression) {
                        const callExpression = currentNode.asKind(SyntaxKind.CallExpression);
                        if (!callExpression) {
                            throw new Error(`CallExpression not found for ${currentNode.getText()}`);
                        }
                        const instanceIsGeneric = callExpression.getTypeArguments().length > 0;
                        if (instanceIsGeneric) {
                            const args = callExpression.getTypeArguments();
                            const conParams = callExpression.getTypeArguments().map(param => param.getText());
                            if (!Helpers.arraysAreEqual(conParams,genParams)) {
                                let genElement;
                                if(element instanceof FunctionDeclaration){
                                    genElement = this.createOrGetFamixFunction(element, {}) as Famix.ParametricFunction;
                                } else {
                                    genElement = this.createOrGetFamixMethod(element, {}) as Famix.ParametricMethod;
                                }
                                const concElement = this.createOrGetFamixConcreteElement(genElement,element,args);
                                const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation") as Set<Famix.Concretisation>;
                                let createConcretisation : boolean = true;
                                concretisations.forEach((conc : Famix.Concretisation) => {
                                    if (genElement.fullyQualifiedName == conc.genericEntity.fullyQualifiedName && conc.concreteEntity.fullyQualifiedName == concElement.fullyQualifiedName){
                                        createConcretisation = false;
                                    }
                                });
        
                                if (createConcretisation) {
                                    const fmxConcretisation : Famix.Concretisation = this.createFamixConcretisation(concElement,genElement);
                                }
                            }
                        }
                        break;
                    }
                    // Remonter à l'élément parent (utile si le nœud de référence est un enfant)
                    currentNode = currentNode.getParent();
                }
            });
        }
    }

    /**
     * Creates a Famix concretisation between a class and an interface
     * @param cls A class
     */
    public createFamixConcretisationInterfaceClass(cls: ClassDeclaration){
    
        const superInterfaces = cls.getImplements();
        superInterfaces.forEach(interfaceType => {
            const interfaceIsGeneric = interfaceType.getTypeArguments().length>0;
            if (interfaceIsGeneric) {
                const interfaceDeclaration = interfaceType.getExpression().getSymbol()?.getDeclarations()[0] as InterfaceDeclaration;
                const genParams = interfaceDeclaration.getTypeParameters().map((param) => param.getText());
                const conParams = cls.getHeritageClauses()[0].getTypeNodes()[0].getTypeArguments().map((param) => param.getText());
                const args = cls.getHeritageClauses()[0].getTypeNodes()[0].getTypeArguments();
                if (!Helpers.arraysAreEqual(conParams,genParams)) {
                    const genInterface = this.createOrGetFamixInterface(interfaceDeclaration) as Famix.ParametricInterface;
                    const conInterface = this.createOrGetFamixConcreteElement(genInterface,interfaceDeclaration,args);
                    const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation") as Set<Famix.Concretisation>;
                    let createConcretisation : boolean = true;
                    concretisations.forEach((conc : Famix.Concretisation) => {
                        if (genInterface.fullyQualifiedName == conc.genericEntity.fullyQualifiedName && conc.concreteEntity.fullyQualifiedName == conInterface.fullyQualifiedName){
                            createConcretisation = false;
                        }
                    });
            
                    if (createConcretisation) {
                        const fmxConcretisation : Famix.Concretisation = this.createFamixConcretisation(conInterface,genInterface);
                    }
                }
            }
        });
    }

    /**
     * Creates a Famix concretisation between an interface and a Type
     * @param element A variable or a function
     * @param inter An interface
     */
    public createFamixConcretisationTypeInstanciation(element: InterfaceDeclaration | ClassDeclaration) {

        const isGeneric = element.getTypeParameters().length > 0;
        if (isGeneric) {
            const genParams = element.getTypeParameters().map(param => param.getText());
            const uses = element.findReferencesAsNodes();
            uses.forEach(use => {
                let parentNode = use.getParent();
                while (parentNode) {
                    if (parentNode.getKind() === SyntaxKind.TypeReference) {
                        const typeReferenceNode = parentNode.asKind(SyntaxKind.TypeReference);
                        if (!typeReferenceNode) {
                            throw new Error(`TypeReferenceNode not found for ${parentNode.getText()}`);
                        }
                        const typeReferenceNodeIsGeneric = typeReferenceNode.getTypeArguments().length > 0;
                        if (typeReferenceNodeIsGeneric) { }
                        const args = typeReferenceNode.getTypeArguments();
                        const conParams = typeReferenceNode.getTypeArguments().map(param => param.getText());
                        if (!Helpers.arraysAreEqual(conParams, genParams)) {
                            let genElement;
                            if (element instanceof ClassDeclaration) {
                                genElement = this.createOrGetFamixClass(element) as Famix.ParametricClass;
                            } else {
                                genElement = this.createOrGetFamixInterface(element) as Famix.ParametricInterface;
                            }
                            const concElement = this.createOrGetFamixConcreteElement(genElement, element, args);
                            const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation") as Set<Famix.Concretisation>;
                            let createConcretisation: boolean = true;
                            concretisations.forEach((conc: Famix.Concretisation) => {
                                if (genElement.fullyQualifiedName == conc.genericEntity.fullyQualifiedName && conc.concreteEntity.fullyQualifiedName == concElement.fullyQualifiedName) {
                                    createConcretisation = false;
                                }
                            });

                            if (createConcretisation) {
                                const fmxConcretisation: Famix.Concretisation = this.createFamixConcretisation(concElement, genElement);
                            }
                        }
                        break;
                    }
                    parentNode = parentNode.getParent();
                }
            });
        }
    }

    public convertToRelativePath(absolutePath: string, absolutePathProject: string) {
        logger.debug(`convertToRelativePath: absolutePath: '${absolutePath}', absolutePathProject: '${absolutePathProject}'`);
        if (absolutePath.startsWith(absolutePathProject)) {
            return absolutePath.replace(absolutePathProject, "").slice(1);
        } else if (absolutePath.startsWith("/")) {
            return absolutePath.slice(1);
        } else {
            return absolutePath;
        }
    }
}

export function isPrimitiveType(typeName: string) {
    return typeName === "number" ||
        typeName === "string" ||
        typeName === "boolean" ||
        typeName === "bigint" ||
        typeName === "symbol" ||
        typeName === "unique symbol" ||
        typeName === "undefined" ||
        typeName === "null" ||
        typeName === "any" ||
        typeName === "unknown" ||
        typeName === "never" ||
        typeName === "void";
}

function initFQN(sourceElement: TSMorphObjectType, famixElement: Famix.SourcedEntity) {
    // handle special cases where an element is a Type -- need to change its name
    if (famixElement instanceof Famix.Type && !(sourceElement instanceof CommentRange) && isTypeContext(sourceElement)) {
        let fqn = FQNFunctions.getFQN(sourceElement);
        // using regex, replace [blah] with [blahType]
        fqn = fqn.replace(/\[([^\]]+)\]/g, "[$1Type]");
        logger.debug("Setting fully qualified name for " + famixElement.getJSON() + " to " + fqn);
        famixElement.fullyQualifiedName = fqn;
        return;
    }
    // catch all (except comments)
    if (!(sourceElement instanceof CommentRange)) {
        const fqn = FQNFunctions.getFQN(sourceElement);
        logger.debug("Setting fully qualified name for " + famixElement.getJSON() + " to " + fqn);
        (famixElement as Famix.NamedEntity).fullyQualifiedName = fqn;
    } 
}


function isTypeContext(sourceElement: TSMorphObjectType): boolean {
    // Just keep the existing SyntaxKind set as it is
    const typeContextKinds = new Set([
        SyntaxKind.Constructor,
        SyntaxKind.MethodDeclaration,
        SyntaxKind.FunctionDeclaration,
        SyntaxKind.FunctionExpression,
        SyntaxKind.ArrowFunction,
        SyntaxKind.Parameter,
        SyntaxKind.VariableDeclaration,
        SyntaxKind.PropertyDeclaration,
        SyntaxKind.PropertySignature,
        SyntaxKind.TypeParameter,
        SyntaxKind.Identifier,
        SyntaxKind.Decorator,
        SyntaxKind.GetAccessor,
        SyntaxKind.SetAccessor,
        SyntaxKind.ImportSpecifier,
        SyntaxKind.EnumDeclaration,
        SyntaxKind.EnumMember,
        SyntaxKind.TypeAliasDeclaration,
        SyntaxKind.ImportDeclaration,
        SyntaxKind.ExpressionWithTypeArguments
    ]);

    return typeContextKinds.has(sourceElement.getKind());
}

function getInterfaceOrClassDeclarationFromExpression(expression: ExpressionWithTypeArguments): InterfaceDeclaration | ClassDeclaration | undefined {
    // Step 1: Get the type of the expression
    const type = expression.getType();

    // Step 2: Get the symbol associated with the type
    let symbol = type.getSymbol();

    if (!symbol) {
        // If symbol is not found, try to get the symbol from the identifier
        const identifier = expression.getFirstDescendantByKind(SyntaxKind.Identifier);
        if (!identifier) {
            throw new Error(`Identifier not found for ${expression.getText()}.`);
        }
        symbol = identifier.getSymbol();
        if (!symbol) {
            throw new Error(`Symbol not found for ${identifier.getText()}.`);
        }
    }

    // Step 3: Resolve the symbol to find the actual declaration
    const interfaceDeclaration = resolveSymbolToInterfaceOrClassDeclaration(symbol);

    if (!interfaceDeclaration) {
        logger.error(`Interface declaration not found for ${expression.getText()}.`);
    }

    return interfaceDeclaration;
}

import { Symbol as TSMorphSymbol, Node as TsMorphNode } from "ts-morph";
import _ from "lodash";

function resolveSymbolToInterfaceOrClassDeclaration(symbol: TSMorphSymbol): InterfaceDeclaration | ClassDeclaration | undefined {
    // Get the declarations associated with the symbol
    const declarations = symbol.getDeclarations();

    // Filter for InterfaceDeclaration or ClassDeclaration
    const interfaceOrClassDeclaration = declarations.find(
        declaration => 
            declaration instanceof InterfaceDeclaration || 
            declaration instanceof ClassDeclaration) as InterfaceDeclaration | ClassDeclaration | undefined;

    if (interfaceOrClassDeclaration) {
        return interfaceOrClassDeclaration;
    }

    // Handle imports: If the symbol is imported, resolve the import to find the actual declaration
    for (const declaration of declarations) {
        if (declaration.getKind() === SyntaxKind.ImportSpecifier) {
            const importSpecifier = declaration as ImportSpecifier;
            const importDeclaration = importSpecifier.getImportDeclaration();
            const moduleSpecifier = importDeclaration.getModuleSpecifierSourceFile();

            if (moduleSpecifier) {
                const exportedSymbols = moduleSpecifier.getExportSymbols();
                const exportedSymbol = exportedSymbols.find(symbol => symbol.getName() === importSpecifier.getName());
                if (exportedSymbol) {
                    return resolveSymbolToInterfaceOrClassDeclaration(exportedSymbol);
                }
            }
        }
    }
    return undefined;
}


export function getPrimitiveTypeName(type: Type): string | undefined {
  const flags = type.compilerType.flags;

  if (flags & ts.TypeFlags.StringLike) return "string";
  if (flags & ts.TypeFlags.NumberLike) return "number";
  if (flags & ts.TypeFlags.BooleanLike) return "boolean";
  if (flags & ts.TypeFlags.BigIntLike) return "bigint";
  if (flags & ts.TypeFlags.UniqueESSymbol) return "unique symbol";
  if (flags & ts.TypeFlags.ESSymbol) return "symbol";
  if (flags & ts.TypeFlags.Undefined) return "undefined";
  if (flags & ts.TypeFlags.Null) return "null";
  if (flags & ts.TypeFlags.Void) return "void";
  if (flags & ts.TypeFlags.Never) return "never";
  if (flags & ts.TypeFlags.Any) return "any";
  if (flags & ts.TypeFlags.Unknown) return "unknown";

  return undefined;
}

// function oldGetInterfaceDeclarationFromExpression(expression: ExpressionWithTypeArguments): InterfaceDeclaration | undefined {
//     // Two cases:
//     // class A implements ImportedInterface, DeclaredInterface {}
//     const type = expression.getType();

//     // ImportedInterface: type will a symbol 
//     let symbol = type.getAliasSymbol();  // will be defined for imported interfaces

//     if (!symbol) {
//         // DeclaredInterface: type will be an InterfaceDeclaration on Identifier node that is the child of the ExpressionWithTypeArguments
//         const identifier = expression.getFirstDescendantByKind(SyntaxKind.Identifier);
//         if (!identifier) {
//             throw new Error(`Identifier not found for ${expression.getText()}.`);
//         }
//         symbol = identifier.getSymbol();
//         if (!symbol) {
//             throw new Error(`Symbol not found for ${identifier.getText()}.`);
//         }
//     }

//     // Step 3: Get the declarations associated with the symbol
//     const declarations = symbol.getDeclarations();

//     // Step 4: Filter for InterfaceDeclaration
//     const interfaceDeclaration = declarations.find(declaration => declaration instanceof InterfaceDeclaration) as InterfaceDeclaration | undefined;

//     if (!interfaceDeclaration) {
//         throw new Error(`Interface declaration not found for ${expression.getText()}.`);
//     }

//     return interfaceDeclaration;
// }
