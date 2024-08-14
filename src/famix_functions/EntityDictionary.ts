import { ClassDeclaration, ConstructorDeclaration, FunctionDeclaration, Identifier, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, PropertyDeclaration, PropertySignature, SourceFile, TypeParameterDeclaration, VariableDeclaration, ParameterDeclaration, Decorator, GetAccessorDeclaration, SetAccessorDeclaration, ImportSpecifier, CommentRange, EnumDeclaration, EnumMember, TypeAliasDeclaration, FunctionExpression, ExpressionWithTypeArguments, ImportDeclaration, ImportEqualsDeclaration, SyntaxKind, Expression, TypeNode, Node, ts, Scope, Type, ArrowFunction } from "ts-morph";
import { isAmbient, isNamespace } from "../analyze_functions/process_functions";
import * as Famix from "../lib/famix/model/famix";
import { FamixRepository } from "../lib/famix/famix_repository";
import { logger, config } from "../analyze";
import GraphemeSplitter from "grapheme-splitter";
import * as Helpers from "./helpers_creation";
import * as FQNFunctions from "../fqn";
import path from "path";
import _ from 'lodash';

export type TSMorphObjectType = ImportDeclaration | ImportEqualsDeclaration | SourceFile | ModuleDeclaration | ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | PropertyDeclaration | PropertySignature | TypeParameterDeclaration | Identifier | Decorator | GetAccessorDeclaration | SetAccessorDeclaration | ImportSpecifier | CommentRange | EnumDeclaration | EnumMember | TypeAliasDeclaration | ExpressionWithTypeArguments;

export type TypeDeclaration = TypeAliasDeclaration | PropertyDeclaration | PropertySignature | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | EnumMember | ImportEqualsDeclaration;

type ParametricVariantType = Famix.ParametricClass | Famix.ParametricInterface | Famix.ParametricFunction | Famix.ParametricMethod;

type ConcreteElementTSMorphType = ClassDeclaration | InterfaceDeclaration | FunctionDeclaration | MethodDeclaration;

export class EntityDictionary {
    
    public famixRep = new FamixRepository();
    private fmxAliasMap = new Map<string, Famix.Alias>(); // Maps the alias names to their Famix model
    private fmxClassMap = new Map<string, Famix.Class | Famix.ParametricClass>(); // Maps the fully qualified class names to their Famix model
    private fmxInterfaceMap = new Map<string, Famix.Interface | Famix.ParametricInterface>(); // Maps the interface names to their Famix model
    private fmxModuleMap = new Map<string, Famix.Module>(); // Maps the namespace names to their Famix model
    private fmxFileMap = new Map<string, Famix.ScriptEntity | Famix.Module>(); // Maps the source file names to their Famix model
    private fmxTypeMap = new Map<string, Famix.Type | Famix.PrimitiveType | Famix.ParameterType>(); // Maps the type names to their Famix model
    private fmxFunctionAndMethodMap = new Map<string, Famix.Function | Famix.ParametricFunction | Famix.Method | Famix.ParametricMethod> // Maps the function names to their Famix model
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

            const fileName = node.getSourceFile().getFilePath();

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
        // check if famixElement doesn't have a valid fullyQualifiedName
        if (typeof (famixElement as any).getFullyQualifiedName === 'function') {
            // The method exists
            const fullyQualifiedName = (famixElement as any).fullyQualifiedName;
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

            fmxIndexFileAnchor.fileName = pathInProject;
            let sourceStart, sourceEnd, sourceLineStart, sourceLineEnd: number;
            if (!(sourceElement instanceof CommentRange)) {
                sourceStart = sourceElement.getStart();
                sourceEnd = sourceElement.getEnd();
                sourceLineStart = sourceElement.getStartLineNumber();
                sourceLineEnd = sourceElement.getEndLineNumber();
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
     * @param m A module
     * @returns The Famix model of the module
     */
    public createOrGetFamixModule(m: ModuleDeclaration): Famix.Module {
        let fmxModule: Famix.Module;
        const moduleName = m.getName();
        const foundModuleName = this.fmxModuleMap.get(moduleName);
        if (!foundModuleName) {
            fmxModule = new Famix.Module();
            fmxModule.name = moduleName;
            fmxModule.isAmbient = isAmbient(m);
            fmxModule.isNamespace = isNamespace(m);
            fmxModule.isModule = !fmxModule.isNamespace && !fmxModule.isAmbient;

            initFQN(m, fmxModule);
            this.makeFamixIndexFileAnchor(m, fmxModule);

            this.fmxModuleMap.set(moduleName, fmxModule);

            this.famixRep.addElement(fmxModule);
        }
        else {
            fmxModule = foundModuleName;
        }

        this.fmxElementObjectMap.set(fmxModule,m);
        return fmxModule;
    }

    /**
     * Creates a Famix alias
     * @param a An alias
     * @returns The Famix model of the alias
     */
    public createFamixAlias(a: TypeAliasDeclaration): Famix.Alias {
        let fmxAlias: Famix.Alias;
        const aliasName = a.getName();
        const aliasFullyQualifiedName = a.getType().getText(); // FQNFunctions.getFQN(a);
        const foundAlias = this.fmxAliasMap.get(aliasFullyQualifiedName);
        if (!foundAlias) {
            fmxAlias = new Famix.Alias();
            fmxAlias.name = a.getName();
            const aliasNameWithGenerics = aliasName + (a.getTypeParameters().length ? ("<" + a.getTypeParameters().map(tp => tp.getName()).join(", ") + ">") : "");
            logger.debug(`> NOTE: alias ${aliasName} has fully qualified name ${aliasFullyQualifiedName} and name with generics ${aliasNameWithGenerics}.`);

            const fmxType = this.createOrGetFamixType(aliasNameWithGenerics, a);
            fmxAlias.aliasedEntity = fmxType;
            initFQN(a, fmxAlias);
            this.makeFamixIndexFileAnchor(a, fmxAlias);

            this.fmxAliasMap.set(aliasFullyQualifiedName, fmxAlias);

            this.famixRep.addElement(fmxAlias);
        }
        else {
            fmxAlias = foundAlias;
        }
        this.fmxElementObjectMap.set(fmxAlias,a);

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
            fmxClass.fullyQualifiedName = classFullyQualifiedName;
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
            params = params+param.getText()+','
        })
        
        params = params.substring(0, params.length - 1)
                
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

        const fmxType = this.createOrGetFamixType(propTypeName, property);
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
    public createOrGetFamixMethod(method: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration, currentCC: { [key: string]: number }): Famix.Method | Famix.Accessor | Famix.ParametricMethod {
        let fmxMethod: Famix.Method | Famix.Accessor | Famix.ParametricMethod;
        const isGeneric = method.getTypeParameters().length > 0;
        const functionFullyQualifiedName = FQNFunctions.getFQN(method);
        if (!this.fmxFunctionAndMethodMap.has(functionFullyQualifiedName)) {

            if (method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) {
                fmxMethod = new Famix.Accessor();
                const isGetter = method instanceof GetAccessorDeclaration;
                const isSetter = method instanceof SetAccessorDeclaration;
                if (isGetter) {(fmxMethod as Famix.Accessor).kind = "getter";}
                if (isSetter) {(fmxMethod as Famix.Accessor).kind = "setter";}
                this.famixRep.addElement(fmxMethod);
            }
            else {
                if (isGeneric) {
                    fmxMethod = new Famix.ParametricMethod();
                }
                else {
                    fmxMethod = new Famix.Method();
                }
                this.famixRep.addElement(fmxMethod);
            }
            const isConstructor = method instanceof ConstructorDeclaration;
            const isSignature = method instanceof MethodSignature;

            let isAbstract = false;
            let isStatic = false;
            if (method instanceof MethodDeclaration || method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) {
                isAbstract = method.isAbstract();
                isStatic = method.isStatic();
            }

            if (isConstructor) {(fmxMethod as Famix.Accessor).kind = "constructor";}
            fmxMethod.isAbstract = isAbstract;
            fmxMethod.isClassSide = isStatic;
            fmxMethod.isPrivate = (method instanceof MethodDeclaration || method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) ? (method.getModifiers().find(x => x.getText() === 'private')) !== undefined : false;
            fmxMethod.isProtected = (method instanceof MethodDeclaration || method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) ? (method.getModifiers().find(x => x.getText() === 'protected')) !== undefined : false;
            fmxMethod.signature = Helpers.computeSignature(method.getText());

            let methodName: string;
            if (isConstructor) {
                methodName = "constructor";
            }
            else {
                methodName = (method as MethodDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration).getName();
            }
            fmxMethod.name = methodName;

            if (!isConstructor) {
                if (method.getName().substring(0, 1) === "#") {
                    fmxMethod.isPrivate = true;
                }
            }

            if (!fmxMethod.isPrivate && !fmxMethod.isProtected) {
                fmxMethod.isPublic = true;
            }
            else {
                fmxMethod.isPublic = false;
            }

            if (!isSignature) {
                fmxMethod.cyclomaticComplexity = currentCC[fmxMethod.name];
            }
            else {
                fmxMethod.cyclomaticComplexity = 0;
            }

            let methodTypeName = this.UNKNOWN_VALUE; 
            try {
                methodTypeName = method.getReturnType().getText().trim();            
            } catch (error) {
                logger.error(`> WARNING: got exception ${error}. Failed to get usable name for return type of method: ${fmxMethod.name}. Continuing...`);
            }

            const fmxType = this.createOrGetFamixType(methodTypeName, method);
            fmxMethod.declaredType = fmxType;
            fmxMethod.numberOfLinesOfCode = method.getEndLineNumber() - method.getStartLineNumber();
            const parameters = method.getParameters();
            fmxMethod.numberOfParameters = parameters.length;

            if (!isSignature) {
                fmxMethod.numberOfStatements = method.getStatements().length;
            }
            else {
                fmxMethod.numberOfStatements = 0;
            }
            
            initFQN(method, fmxMethod);
            this.makeFamixIndexFileAnchor(method, fmxMethod);

            this.fmxFunctionAndMethodMap.set(functionFullyQualifiedName, fmxMethod);
        }
        else {
            fmxMethod = this.fmxFunctionAndMethodMap.get(functionFullyQualifiedName) as (Famix.Method | Famix.Accessor | Famix.ParametricMethod);
        }

        this.fmxElementObjectMap.set(fmxMethod,method);
        
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
            fmxFunction.fullyQualifiedName = functionFullyQualifiedName;
    
            let functionTypeName = this.UNKNOWN_VALUE;
            try {
                functionTypeName = func.getReturnType().getText().trim();
            } catch (error) {
                logger.error(`> WARNING: got exception ${error}. Failed to get usable name for return type of function: ${func.getName()}. Continuing...`);
            }
    
            const fmxType = this.createOrGetFamixType(functionTypeName, func);
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
    public createFamixParameter(param: ParameterDeclaration): Famix.Parameter {
        const fmxParam = new Famix.Parameter();

        let paramTypeName = this.UNKNOWN_VALUE;
        try {
            paramTypeName = param.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for parameter: ${param.getName()}. Continuing...`);
        }

        const fmxType = this.createOrGetFamixType(paramTypeName, param);
        fmxParam.declaredType = fmxType;
        fmxParam.name = param.getName();

        initFQN(param, fmxParam);
        this.makeFamixIndexFileAnchor(param, fmxParam);

        this.famixRep.addElement(fmxParam);

        this.fmxElementObjectMap.set(fmxParam,param);

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
     * Creates a Famix type parameter
     * @param tp A type parameter
     * @returns The Famix model of the type parameter
     */
    public createOrGetFamixConcreteType(param: TypeNode): Famix.ParameterType | Famix.PrimitiveType | Famix.Class | Famix.Interface {
        const typeParameterDeclaration = param.getSymbol()?.getDeclarations()[0] as TypeParameterDeclaration;
        const parameterTypeName : string = param.getText();
        let fmxParameterType: Famix.Type | Famix.Class | Famix.Interface | undefined = undefined;

        let isClassOrInterface = false;
        if (this.fmxClassMap.has(parameterTypeName)){
            this.fmxClassMap.forEach((obj, name) => {
                if(obj instanceof Famix.ParametricClass){
                    if (name === param.getText() && obj.genericParameters.size>0) {
                        fmxParameterType = obj;
                        isClassOrInterface = true;
                    } 
                } else {
                    if (name === param.getText()) {
                        fmxParameterType = obj;
                        isClassOrInterface = true;
                    } 
                }   
            })
        }

        if (this.fmxInterfaceMap.has(parameterTypeName)){
            this.fmxInterfaceMap.forEach((obj, name) => {
                if(obj instanceof Famix.ParametricInterface){
                    if (name === param.getText() && obj.genericParameters.size>0) {
                        fmxParameterType = obj;
                        isClassOrInterface = true;
                    } 
                } else {
                    if (name === param.getText()) {
                        fmxParameterType = obj;
                        isClassOrInterface = true;
                    } 
                }   
            })
        }

        if(!isClassOrInterface){
            if (!this.fmxTypeMap.has(parameterTypeName)) {           
                if (parameterTypeName === "number" || parameterTypeName === "string" || parameterTypeName === "boolean" || parameterTypeName === "bigint" || parameterTypeName === "symbol" || parameterTypeName === "undefined" || parameterTypeName === "null" || parameterTypeName === "any" || parameterTypeName === "unknown" || parameterTypeName === "never" || parameterTypeName === "void") {
                    fmxParameterType = new Famix.PrimitiveType();
                    fmxParameterType.isStub = true;
                } else {
                    fmxParameterType = new Famix.ParameterType();
                } 
    
                fmxParameterType.name = parameterTypeName;
                this.famixRep.addElement(fmxParameterType);
                this.fmxTypeMap.set(parameterTypeName, fmxParameterType);
                this.fmxElementObjectMap.set(fmxParameterType,typeParameterDeclaration);
            }
            else {
                const result = this.fmxTypeMap.get(parameterTypeName);
                if (result) {
                    fmxParameterType = result;
                } else {
                    throw new Error(`Famix type ${parameterTypeName} is not found in the Type map.`);
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
    public createFamixVariable(variable: VariableDeclaration): Famix.Variable {
        const fmxVariable = new Famix.Variable();
    
        let variableTypeName = this.UNKNOWN_VALUE;
        try {
            variableTypeName = variable.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for variable: ${variable.getName()}. Continuing...`);
        }
    
        const fmxType = this.createOrGetFamixType(variableTypeName, variable);
        fmxVariable.declaredType = fmxType;
        fmxVariable.name = variable.getName();
        initFQN(variable, fmxVariable);
        this.makeFamixIndexFileAnchor(variable, fmxVariable);
    
        this.famixRep.addElement(fmxVariable);
    
        this.fmxElementObjectMap.set(fmxVariable,variable);
    
        return fmxVariable;
    }

    /**
     * Creates a Famix enum
     * @param enumEntity An enum
     * @returns The Famix model of the enum
     */
    public createFamixEnum(enumEntity: EnumDeclaration): Famix.Enum {
        const fmxEnum = new Famix.Enum();
        fmxEnum.name = enumEntity.getName();
        initFQN(enumEntity, fmxEnum);
        this.makeFamixIndexFileAnchor(enumEntity, fmxEnum);

        this.famixRep.addElement(fmxEnum);

        this.fmxElementObjectMap.set(fmxEnum,enumEntity);

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

        const fmxType = this.createOrGetFamixType(enumValueTypeName, enumMember);
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
    public createOrGetFamixType(typeName: string, element: TypeDeclaration): Famix.Type | Famix.PrimitiveType | Famix.ParameterType {
        let fmxType: Famix.Type | Famix.PrimitiveType | Famix.ParameterType;
        let isPrimitiveType = false;
        let isParameterType = false;

        logger.debug("Creating (or getting) type: '" + typeName + "' of element: " + element?.getText() + " of kind: " + element?.getKindName());
        let ancestor: Famix.ContainerEntity | undefined = undefined;
        if (element !== undefined) {
            const typeAncestor = Helpers.findTypeAncestor(element);
            if (!typeAncestor) {
                throw new Error(`Ancestor not found for element ${element.getText()}.`);
            }
            const ancestorFullyQualifiedName = FQNFunctions.getFQN(typeAncestor);
            ancestor = this.famixRep.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
            if (!ancestor) {
                logger.debug(`Ancestor ${FQNFunctions.getFQN(typeAncestor)} not found. Adding the new type.`);
                ancestor = this.createOrGetFamixType(typeAncestor.getText(), typeAncestor as TypeDeclaration);
            }
        }

        if (typeName === "number" || typeName === "string" || typeName === "boolean" || typeName === "bigint" || typeName === "symbol" || typeName === "undefined" || typeName === "null" || typeName === "any" || typeName === "unknown" || typeName === "never" || typeName === "void") {
            isPrimitiveType = true;
        }

        if(!isPrimitiveType && typeName.includes("<") && typeName.includes(">") && !(typeName.includes("=>"))) {
            isParameterType = true;
        }

        if (!this.fmxTypeMap.has(typeName)) {
            if (isPrimitiveType) {
                fmxType = new Famix.PrimitiveType();
                fmxType.isStub = true;
            }
            else if (isParameterType) {
                fmxType = new Famix.ParameterType();
                const parameterTypeNames = typeName.substring(typeName.indexOf("<") + 1, typeName.indexOf(">")).split(",").map(s => s.trim());
                const baseTypeName = typeName.substring(0, typeName.indexOf("<")).trim();
                parameterTypeNames.forEach(parameterTypeName => {
                    const fmxParameterType = this.createOrGetFamixType(parameterTypeName, element);
                    (fmxType as Famix.ParameterType).addArgument(fmxParameterType);
                });
                const fmxBaseType = this.createOrGetFamixType(baseTypeName, element);
                (fmxType as Famix.ParameterType).baseType = fmxBaseType;
            }
            else {
                fmxType = new Famix.Type();
            }

            fmxType.name = typeName;
            if (!ancestor) {
                throw new Error(`Ancestor not found for type ${typeName}.`);
            }
            fmxType.container = ancestor;
            initFQN(element, fmxType);
            this.makeFamixIndexFileAnchor(element, fmxType);

            this.famixRep.addElement(fmxType);

            this.fmxTypeMap.set(typeName, fmxType);
        }
        else {
            const result = this.fmxTypeMap.get(typeName);
            if (result) {
                fmxType = result;
            } else {
                throw new Error(`Famix type ${typeName} is not found in the Type map.`);
            }
        }

        this.fmxElementObjectMap.set(fmxType,element);

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
        const ancestorFullyQualifiedName = FQNFunctions.getFQN(nodeReferenceAncestor);
        let accessor = this.famixRep.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
        if (!accessor) {
            logger.error(`Ancestor ${ancestorFullyQualifiedName} of kind ${nodeReferenceAncestor.getKindName()} not found.`);
            // accessor = this.createOrGetFamixType(ancestorFullyQualifiedName, nodeReferenceAncestor as TypeDeclaration);
        }

        const fmxAccess = new Famix.Access();
        fmxAccess.accessor = accessor;
        fmxAccess.variable = fmxVar;

        this.famixRep.addElement(fmxAccess);

        this.fmxElementObjectMap.set(fmxAccess,node);
    }

    /**
     * Creates a Famix invocation
     * @param node A node
     * @param m A method or a function
     * @param id The id of the method or the function
     */
    public createFamixInvocation(node: Identifier, m: MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, id: number): void {
        const fmxMethodOrFunction = this.famixRep.getFamixEntityById(id) as Famix.BehavioralEntity;
        const nodeReferenceAncestor = Helpers.findAncestor(node);
        const ancestorFullyQualifiedName = FQNFunctions.getFQN(nodeReferenceAncestor);
        const sender = this.famixRep.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
        const receiverFullyQualifiedName = FQNFunctions.getFQN(m.getParent());
        const receiver = this.famixRep.getFamixEntityByFullyQualifiedName(receiverFullyQualifiedName) as Famix.NamedEntity;

        const fmxInvocation = new Famix.Invocation();
        fmxInvocation.sender = sender;
        fmxInvocation.receiver = receiver;
        fmxInvocation.addCandidate(fmxMethodOrFunction);
        fmxInvocation.signature = fmxMethodOrFunction.signature;

        this.famixRep.addElement(fmxInvocation);

        this.fmxElementObjectMap.set(fmxInvocation,node);
    }

    /**
     * Creates a Famix inheritance
     * @param cls A class or an interface (subclass)
     * @param inhClass The inherited class or interface (superclass)
     */
    public createFamixInheritance(cls: ClassDeclaration | InterfaceDeclaration, inhClass: ClassDeclaration | InterfaceDeclaration | ExpressionWithTypeArguments): void {
        const fmxInheritance = new Famix.Inheritance();
        // const clsName = cls.getName();
        const classFullyQualifiedName = FQNFunctions.getFQN(cls);
        logger.debug(`createFamixInheritance: classFullyQualifiedName: class fqn = ${classFullyQualifiedName}`);
        let subClass: Famix.Class | Famix.Interface | undefined;
        if (cls instanceof ClassDeclaration) {
            subClass = this.fmxClassMap.get(classFullyQualifiedName);
        }
        else {
            subClass = this.fmxInterfaceMap.get(classFullyQualifiedName);
        }
        if (!subClass) {
            throw new Error(`Subclass ${classFullyQualifiedName} not found in Class or Interface maps.`);
        }
        
        let inhClassName: string | undefined;
        let inhClassFullyQualifiedName: string;
        let superClass: Famix.Class | Famix.Interface | undefined;
        if (inhClass instanceof ClassDeclaration || inhClass instanceof InterfaceDeclaration) {
            inhClassName = inhClass.getName();
            if (!inhClassName) {
                throw new Error(`Inherited class or interface name not found for ${inhClass.getText()}.`);
            }
            inhClassFullyQualifiedName = FQNFunctions.getFQN(inhClass);
            if (inhClass instanceof ClassDeclaration) {
                superClass = this.fmxClassMap.get(inhClassFullyQualifiedName);
            }
            else {
                superClass = this.fmxInterfaceMap.get(inhClassFullyQualifiedName);
            }
            if (!superClass) {
                throw new Error(`Superclass ${classFullyQualifiedName} not found in Class or Interface maps.`);
            }
        }
        else {
            // inhClass is an ExpressionWithTypeArguments
            inhClassName = inhClass.getExpression().getText();
            // what is inhClassFullyQualifiedName? TODO
            inhClassFullyQualifiedName = 'Undefined_Scope_from_importer.' + inhClassName;
        }

        if (superClass === undefined) {
            if (inhClass instanceof ClassDeclaration) {
                superClass = new Famix.Class();
                this.fmxClassMap.set(inhClassFullyQualifiedName, superClass);
            }
            else {
                superClass = new Famix.Interface();
                this.fmxInterfaceMap.set(inhClassFullyQualifiedName, superClass);
            }

            this.fmxElementObjectMap.set(superClass,inhClass);

            superClass.name = inhClassName;
            superClass.fullyQualifiedName = inhClassFullyQualifiedName;
            superClass.isStub = true;

            this.makeFamixIndexFileAnchor(inhClass, superClass);
        
            this.famixRep.addElement(superClass);
        }

        fmxInheritance.subclass = subClass;
        fmxInheritance.superclass = superClass;

        this.famixRep.addElement(fmxInheritance);

        // We don't map inheritance to the source code element because there are two elements (super, sub)
        // this.fmxElementObjectMap.set(fmxInheritance, null);

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
    public oldCreateFamixImportClause(importClauseInfo: {importDeclaration?: ImportDeclaration | ImportEqualsDeclaration, importerSourceFile: SourceFile, moduleSpecifierFilePath: string, importElement: ImportSpecifier | Identifier, isInExports: boolean, isDefaultExport: boolean}): void {
        const {importDeclaration, importerSourceFile: importer, moduleSpecifierFilePath, importElement, isInExports, isDefaultExport} = importClauseInfo;
        logger.debug(`createFamixImportClause: Creating import clause:`);
        const fmxImportClause = new Famix.ImportClause();

        let importedEntity: Famix.NamedEntity | Famix.StructuralEntity | undefined = undefined;
        let importedEntityName: string;

        const absolutePathProject = this.famixRep.getAbsolutePath();
        
        const absolutePath = path.normalize(moduleSpecifierFilePath);
        // convert the path and remove any windows backslashes introduced by path.normalize
        const pathInProject: string = this.convertToRelativePath(absolutePath, absolutePathProject).replace(/\\/g, "/");
        let pathName = "{" + pathInProject + "}.";

        // Named imports, e.g. import { ClassW } from "./complexExportModule";

        // Start with simple import clause (without referring to the actual variable)

        if (importDeclaration instanceof ImportDeclaration 
            && importElement instanceof ImportSpecifier) { 
                importedEntityName = importElement.getName();
            pathName = pathName + importedEntityName;
            if (isInExports) {
                importedEntity = this.famixRep.getFamixEntityByFullyQualifiedName(pathName) as Famix.NamedEntity;
            }
            if (importedEntity === undefined) {
                importedEntity = new Famix.NamedEntity();
                importedEntity.name = importedEntityName;
                if (!isInExports) {
                    importedEntity.isStub = true;
                }
                importedEntity.fullyQualifiedName = pathName;
                this.makeFamixIndexFileAnchor(importElement, importedEntity);
                // must add entity to repository
                this.famixRep.addElement(importedEntity);
            }
        }
        // handle import equals declarations, e.g. import myModule = require("./complexExportModule");
        // TypeScript can't determine the type of the imported module, so we create a Module entity
        else if (importDeclaration instanceof ImportEqualsDeclaration) {
            importedEntityName = importDeclaration?.getName();
            pathName = pathName + importedEntityName;
            importedEntity = new Famix.StructuralEntity();
            importedEntity.name = importedEntityName;
            initFQN(importDeclaration, importedEntity);
            this.makeFamixIndexFileAnchor(importElement, importedEntity);
            importedEntity.fullyQualifiedName = pathName;
            const anyType = this.createOrGetFamixType('any', importDeclaration);
            (importedEntity as Famix.StructuralEntity).declaredType = anyType;
        } else {  // default imports, e.g. import ClassW from "./complexExportModule";  
            importedEntityName = importElement.getText();
            pathName = pathName + (isDefaultExport ? "defaultExport" : "namespaceExport");
            importedEntity = new Famix.NamedEntity();
            importedEntity.name = importedEntityName;
            importedEntity.fullyQualifiedName = pathName;
            this.makeFamixIndexFileAnchor(importElement, importedEntity);
        }
        // I don't think it should be added to the repository if it exists already
        if (!isInExports) this.famixRep.addElement(importedEntity);
        const importerFullyQualifiedName = FQNFunctions.getFQN(importer);
        const fmxImporter = this.famixRep.getFamixEntityByFullyQualifiedName(importerFullyQualifiedName) as Famix.Module;
        fmxImportClause.importingEntity = fmxImporter;
        fmxImportClause.importedEntity = importedEntity;
        if (importDeclaration instanceof ImportEqualsDeclaration) {
            fmxImportClause.moduleSpecifier = importDeclaration?.getModuleReference().getText() as string;
        } else {
            fmxImportClause.moduleSpecifier = importDeclaration?.getModuleSpecifierValue() as string;
        }
    
        logger.debug(`createFamixImportClause: ${fmxImportClause.importedEntity?.name} (of type ${
            Helpers.getSubTypeName(fmxImportClause.importedEntity)}) is imported by ${fmxImportClause.importingEntity?.name}`);

        fmxImporter.addOutgoingImport(fmxImportClause);

        this.famixRep.addElement(fmxImportClause);

        if (importDeclaration) this.fmxElementObjectMap.set(fmxImportClause, importDeclaration);
    }

    /**
     * Creates a Famix Arrow Function
     * @param arrowExpression An Expression
     * @returns The Famix model of the variable
     */
    public createFamixArrowFunction(arrowExpression: Expression, currentCC: { [key: string]: number } ): Famix.ArrowFunction | Famix.ParametricArrowFunction {
        
        let fmxArrowFunction: Famix.ArrowFunction | Famix.ParametricArrowFunction;

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

        const fmxType = this.createOrGetFamixType(functionTypeName, arrowFunction as unknown as FunctionDeclaration);
        fmxArrowFunction.declaredType = fmxType;
        fmxArrowFunction.numberOfLinesOfCode = arrowFunction.getEndLineNumber() - arrowFunction.getStartLineNumber();
        const parameters = arrowFunction.getParameters();
        fmxArrowFunction.numberOfParameters = parameters.length;
        fmxArrowFunction.numberOfStatements = arrowFunction.getStatements().length;
        initFQN(arrowExpression as unknown as TSMorphObjectType, fmxArrowFunction);
        this.makeFamixIndexFileAnchor(arrowExpression as unknown as TSMorphObjectType, fmxArrowFunction);
        this.famixRep.addElement(fmxArrowFunction);
        this.fmxElementObjectMap.set(fmxArrowFunction,arrowFunction as unknown as TSMorphObjectType);

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
        const parameterConcretisation = this.createFamixParameterConcretisation(fmxConcretisation);
            
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
        
        let conClassTypeParametersIterator = concreteParameters.values();
        let genClassTypeParametersIterator = genericParameters.values();
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
                })
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
                        let conEntity;
                        conEntity = this.createOrGetFamixConcreteElement(genEntity,EntityDeclaration,args);
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
                        let conEntity;
                        conEntity = this.createOrGetFamixConcreteElement(genEntity,cls,instance.getTypeArguments());
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
                let currentNode: Node | undefined = usage;

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
                                let concElement;
                                concElement = this.createOrGetFamixConcreteElement(genElement,element,args);
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
    public createFamixConcretisationTypeInstanciation(element: InterfaceDeclaration | ClassDeclaration){

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
                        if (typeReferenceNodeIsGeneric) {}
                            const args = typeReferenceNode.getTypeArguments();
                            const conParams = typeReferenceNode.getTypeArguments().map(param => param.getText());
                            if (!Helpers.arraysAreEqual(conParams,genParams)) {
                                let genElement;
                                if(element instanceof ClassDeclaration){
                                    genElement = this.createOrGetFamixClass(element) as Famix.ParametricClass;
                                } else {
                                    genElement = this.createOrGetFamixInterface(element) as Famix.ParametricInterface;
                                }
                                let concElement;
                                concElement = this.createOrGetFamixConcreteElement(genElement,element,args);
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
                        break;
                    }
                    parentNode = parentNode.getParent();
                }
            });
        }
    }

    public convertToRelativePath(absolutePath: string, absolutePathProject: string) {
        return absolutePath.replace(absolutePathProject, "").slice(1);
    }
}
function initFQN(sourceElement: TSMorphObjectType, famixElement: Famix.SourcedEntity) {
    if (!(sourceElement instanceof CommentRange)) {
        const fqn = FQNFunctions.getFQN(sourceElement);
        logger.debug("Setting fully qualified name for " + famixElement.getJSON() + " to " + fqn);
        (famixElement as Famix.NamedEntity).fullyQualifiedName = fqn;
    }
}

