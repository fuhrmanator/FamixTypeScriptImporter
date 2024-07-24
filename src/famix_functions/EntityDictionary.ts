import { ClassDeclaration, ConstructorDeclaration, FunctionDeclaration, Identifier, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, PropertyDeclaration, PropertySignature, SourceFile, TypeParameterDeclaration, VariableDeclaration, ParameterDeclaration, Decorator, GetAccessorDeclaration, SetAccessorDeclaration, ImportSpecifier, CommentRange, EnumDeclaration, EnumMember, TypeAliasDeclaration, FunctionExpression, ExpressionWithTypeArguments, ImportDeclaration, ImportEqualsDeclaration, SyntaxKind, Expression, TypeNode, Node, ts, Scope, Type, ArrowFunction } from "ts-morph";
import { isAmbient, isNamespace } from "../analyze_functions/process_functions";
import * as Famix from "../lib/famix/src/model/famix";
import { logger, config } from "../analyze";
import GraphemeSplitter from "grapheme-splitter";
import * as Helpers from "./helpers_creation";
import * as FQNFunctions from "../fqn";
import { FamixRepository } from "../lib/famix/src/famix_repository";
import path from "path";
import _ from 'lodash';

export type TSMorphObjectType = ImportDeclaration | ImportEqualsDeclaration | SourceFile | ModuleDeclaration | ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | PropertyDeclaration | PropertySignature | TypeParameterDeclaration | Identifier | Decorator | GetAccessorDeclaration | SetAccessorDeclaration | ImportSpecifier | CommentRange | EnumDeclaration | EnumMember | TypeAliasDeclaration | ExpressionWithTypeArguments;

export type TypeDeclaration = TypeAliasDeclaration | PropertyDeclaration | PropertySignature | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | EnumMember;

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
            
    constructor() {
        this.famixRep.setFmxElementObjectMap(this.fmxElementObjectMap);      
    }

    /**
     * Makes a Famix index file anchor
     * @param sourceElement A source element
     * @param famixElement The Famix model of the source element
     */
    public makeFamixIndexFileAnchor(sourceElement: TSMorphObjectType, famixElement: Famix.SourcedEntity): void {
        logger.debug("making index file anchor for '" + sourceElement?.getText() + "' with famixElement " + famixElement.getJSON());
        const fmxIndexFileAnchor = new Famix.IndexedFileAnchor();
        fmxIndexFileAnchor.setElement(famixElement);
        this.fmxElementObjectMap.set(famixElement,sourceElement);

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

            fmxIndexFileAnchor.setFileName(pathInProject);
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
            fmxIndexFileAnchor.setStartPos(sourceStart + 1);
            fmxIndexFileAnchor.setEndPos(sourceEnd + 1);
            if (!(sourceElement instanceof CommentRange)) {
                fmxIndexFileAnchor.setStartLine(sourceLineStart);
                fmxIndexFileAnchor.setEndLine(sourceLineEnd);    
            }

            if (!(famixElement instanceof Famix.ImportClause || famixElement instanceof Famix.Access || famixElement instanceof Famix.Reference || famixElement instanceof Famix.Invocation || famixElement instanceof Famix.Inheritance) && !(famixElement instanceof Famix.Comment) && !(sourceElement instanceof CommentRange) && !(sourceElement instanceof Identifier) && !(sourceElement instanceof ImportSpecifier) && !(sourceElement instanceof ExpressionWithTypeArguments)) {
                (famixElement as Famix.NamedEntity).setFullyQualifiedName(FQNFunctions.getFQN(sourceElement));
            }
        } else {
            // sourceElement is null
            logger.warn("sourceElement is null for famixElement " + famixElement.getJSON());
            fmxIndexFileAnchor.setFileName("unknown");
            fmxIndexFileAnchor.setStartPos(0);
            fmxIndexFileAnchor.setEndPos(0);
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
        if (!this.fmxFileMap.has(fullyQualifiedFilename)) {
            if (isModule) {
                fmxFile = new Famix.Module();
            }
            else {
                fmxFile = new Famix.ScriptEntity();
            }
            fmxFile.setName(fileName);
            fmxFile.setNumberOfLinesOfText(f.getEndLineNumber() - f.getStartLineNumber());
            fmxFile.setNumberOfCharacters(f.getFullText().length);

            this.makeFamixIndexFileAnchor(f, fmxFile);

            this.fmxFileMap.set(fullyQualifiedFilename, fmxFile);
            this.famixRep.addElement(fmxFile);
        }
        else {
            fmxFile = this.fmxFileMap.get(fullyQualifiedFilename);
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
        if (!this.fmxModuleMap.has(moduleName)) {
            fmxModule = new Famix.Module();
            fmxModule.setName(moduleName);
            fmxModule.$isAmbient = isAmbient(m);
            fmxModule.$isNamespace = isNamespace(m);
            fmxModule.$isModule = !fmxModule.$isNamespace && !fmxModule.$isAmbient;

            this.makeFamixIndexFileAnchor(m, fmxModule);

            this.fmxModuleMap.set(moduleName, fmxModule);

            this.famixRep.addElement(fmxModule);
        }
        else {
            fmxModule = this.fmxModuleMap.get(moduleName);
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
        if (!this.fmxAliasMap.has(aliasFullyQualifiedName)) {
            fmxAlias = new Famix.Alias();
            fmxAlias.setName(a.getName());
            const aliasNameWithGenerics = aliasName + (a.getTypeParameters().length ? ("<" + a.getTypeParameters().map(tp => tp.getName()).join(", ") + ">") : "");
            logger.debug(`> NOTE: alias ${aliasName} has fully qualified name ${aliasFullyQualifiedName} and name with generics ${aliasNameWithGenerics}.`);

            const fmxType = this.createOrGetFamixType(aliasNameWithGenerics, a);
            fmxAlias.setAliasedEntity(fmxType);

            this.makeFamixIndexFileAnchor(a, fmxAlias);

            this.fmxAliasMap.set(aliasFullyQualifiedName, fmxAlias);

            this.famixRep.addElement(fmxAlias);
        }
        else {
            fmxAlias = this.fmxAliasMap.get(aliasFullyQualifiedName);
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
        const clsName = cls.getName();
        const isGeneric = cls.getTypeParameters().length;
        if (!this.fmxClassMap.has(classFullyQualifiedName)) {
            if (isGeneric) {
                fmxClass = new Famix.ParametricClass();
            }
            else {
                fmxClass = new Famix.Class();
            }

            fmxClass.setName(clsName);
            fmxClass.setFullyQualifiedName(classFullyQualifiedName);
            fmxClass.setIsAbstract(isAbstract);

            this.makeFamixIndexFileAnchor(cls, fmxClass);

            this.fmxClassMap.set(classFullyQualifiedName, fmxClass);

            this.famixRep.addElement(fmxClass);

            this.fmxElementObjectMap.set(fmxClass,cls);
        }
        else {
            fmxClass = this.fmxClassMap.get(classFullyQualifiedName) as (Famix.Class | Famix.ParametricClass);
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
        if (!this.fmxInterfaceMap.has(interFullyQualifiedName)) {
            const isGeneric = inter.getTypeParameters().length;
            if (isGeneric) {
                fmxInterface = new Famix.ParametricInterface();
            }
            else {
                fmxInterface = new Famix.Interface();
            }

            fmxInterface.setName(interName);

            this.makeFamixIndexFileAnchor(inter, fmxInterface);

            this.fmxInterfaceMap.set(interFullyQualifiedName, fmxInterface);

            this.famixRep.addElement(fmxInterface);

            this.fmxElementObjectMap.set(fmxInterface,inter);
        }
        else {
            fmxInterface = this.fmxInterfaceMap.get(interFullyQualifiedName) as (Famix.Interface | Famix.ParametricInterface);
        }
        return fmxInterface;
    }

    /**
     * Creates or gets a Famix concrete element
     * @param el A parametric Element   
     * @param elDeclaration the element declaration
     * @param concreteArguments concrete arguments
     * @returns A parametric Element  
     */
    public createOrGetFamixConcreteElement(el : Famix.ParametricClass | Famix.ParametricInterface | Famix.ParametricFunction | Famix.ParametricMethod, elDeclaration : ClassDeclaration | InterfaceDeclaration | FunctionDeclaration | MethodDeclaration, concreteArguments : any): Famix.ParametricClass | Famix.ParametricInterface | Famix.ParametricFunction | Famix.ParametricMethod {
        
        let fullyQualifiedFilename = el.getFullyQualifiedName();
        let params = "";
        
        concreteArguments.map((param) => {
            params = params+param.getText()+','
        })
        
        params = params.substring(0, params.length - 1)
                
        fullyQualifiedFilename = Helpers.replaceLastBetweenTags(fullyQualifiedFilename,params);

        let concElement;

        if (!this.fmxInterfaceMap.has(fullyQualifiedFilename) && !this.fmxClassMap.has(fullyQualifiedFilename) && !this.fmxFunctionAndMethodMap.has(fullyQualifiedFilename)){
            concElement = _.cloneDeep(el); 
            concElement.setFullyQualifiedName(fullyQualifiedFilename);
            concElement.clearGenericParameters();
            concreteArguments.map((param) => {
                const parameter = this.createOrGetFamixConcreteType(param);
                concElement.addConcreteParameter(parameter);
            })
            
            if (el instanceof Famix.ParametricClass) {
                this.fmxClassMap.set(fullyQualifiedFilename, concElement as Famix.ParametricClass);
            } else if (el instanceof Famix.ParametricInterface) {
                this.fmxInterfaceMap.set(fullyQualifiedFilename, concElement as Famix.ParametricInterface);
            } else if (el instanceof Famix.ParametricFunction) {
                this.fmxFunctionAndMethodMap.set(fullyQualifiedFilename, concElement as Famix.ParametricFunction);
            } else if (el instanceof Famix.ParametricMethod) {
                this.fmxFunctionAndMethodMap.set(fullyQualifiedFilename, concElement as Famix.ParametricMethod);
            }
            this.famixRep.addElement(concElement);
            this.fmxElementObjectMap.set(concElement,elDeclaration);
        } else {
            if (el instanceof Famix.ParametricClass) {
                concElement = this.fmxClassMap.get(fullyQualifiedFilename);
            } else if (el instanceof Famix.ParametricInterface) {
                concElement = this.fmxInterfaceMap.get(fullyQualifiedFilename);
            } else if (el instanceof Famix.ParametricFunction) {
                concElement = this.fmxFunctionAndMethodMap.get(fullyQualifiedFilename);
            } else if (el instanceof Famix.ParametricMethod) {
                concElement = this.fmxFunctionAndMethodMap.get(fullyQualifiedFilename);
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
        fmxProperty.setName(property.getName());

        let propTypeName = this.UNKNOWN_VALUE;
        try {
            propTypeName = property.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for property: ${property.getName()}. Continuing...`);
        }

        const fmxType = this.createOrGetFamixType(propTypeName, property);
        fmxProperty.setDeclaredType(fmxType);

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
                    fmxProperty.setIsClassSide(true);
                    break;
                case "readonly":
                    fmxProperty.readOnly = true;
                    break;
                default:
                    break;
            }
        });

        if (!isSignature && property.getExclamationTokenNode()) {
            fmxProperty.addModifier("!");
        }
        if (property.getQuestionTokenNode()) {
            fmxProperty.addModifier("?");
        }
        if (property.getName().substring(0, 1) === "#") {
            fmxProperty.addModifier("#");
        }

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
    public createOrGetFamixMethod(method: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration, currentCC: unknown): Famix.Method | Famix.Accessor | Famix.ParametricMethod {
        let fmxMethod: Famix.Method | Famix.Accessor | Famix.ParametricMethod;
        const isGeneric = method.getTypeParameters().length > 0;
        const functionFullyQualifiedName = FQNFunctions.getFQN(method);
        if (!this.fmxFunctionAndMethodMap.has(functionFullyQualifiedName)) {

            if (method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) {
                fmxMethod = new Famix.Accessor();
                const isGetter = method instanceof GetAccessorDeclaration;
                const isSetter = method instanceof SetAccessorDeclaration;
                if (isGetter) {(fmxMethod as Famix.Accessor).setKind("getter");}
                if (isSetter) {(fmxMethod as Famix.Accessor).setKind("setter");}
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
            fmxMethod.setIsGeneric(isGeneric);

            let isAbstract = false;
            let isStatic = false;
            if (method instanceof MethodDeclaration || method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) {
                isAbstract = method.isAbstract();
                isStatic = method.isStatic();
            }

            if (isConstructor) {(fmxMethod as Famix.Accessor).setKind("constructor");}
            fmxMethod.setIsAbstract(isAbstract);
            fmxMethod.setIsClassSide(isStatic);
            fmxMethod.setIsPrivate((method instanceof MethodDeclaration || method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) ? (method.getModifiers().find(x => x.getText() === 'private')) !== undefined : false);
            fmxMethod.setIsProtected((method instanceof MethodDeclaration || method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) ? (method.getModifiers().find(x => x.getText() === 'protected')) !== undefined : false);
            fmxMethod.setSignature(Helpers.computeSignature(method.getText()));

            let methodName: string;
            if (isConstructor) {
                methodName = "constructor";
            }
            else {
                methodName = (method as MethodDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration).getName();
            }
            fmxMethod.setName(methodName);

            if (!isConstructor) {
                if (method.getName().substring(0, 1) === "#") {
                    fmxMethod.setIsPrivate(true);
                }
            }

            if (!fmxMethod.getIsPrivate() && !fmxMethod.getIsProtected()) {
                fmxMethod.setIsPublic(true);    
            }
            else {
                fmxMethod.setIsPublic(false);
            }

            if (!isSignature) {
                fmxMethod.setCyclomaticComplexity(currentCC[fmxMethod.getName()]);
            }
            else {
                fmxMethod.setCyclomaticComplexity(0);
            }

            let methodTypeName = this.UNKNOWN_VALUE; 
            try {
                methodTypeName = method.getReturnType().getText().trim();            
            } catch (error) {
                logger.error(`> WARNING: got exception ${error}. Failed to get usable name for return type of method: ${fmxMethod.getName()}. Continuing...`);
            }

            const fmxType = this.createOrGetFamixType(methodTypeName, method);
            fmxMethod.setDeclaredType(fmxType);
            fmxMethod.setNumberOfLinesOfCode(method.getEndLineNumber() - method.getStartLineNumber());
            const parameters = method.getParameters();
            fmxMethod.setNumberOfParameters(parameters.length);

            if (!isSignature) {
                fmxMethod.setNumberOfStatements(method.getStatements().length);
            }
            else {
                fmxMethod.setNumberOfStatements(0);
            }
            
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
    public createOrGetFamixFunction(func: FunctionDeclaration | FunctionExpression, currentCC: unknown): Famix.Function | Famix.ParametricFunction {
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
    
            if (func.getName()) {
                fmxFunction.setName(func.getName());
            }
            else {
                fmxFunction.setName("anonymous");
            }

            fmxFunction.setSignature(Helpers.computeSignature(func.getText()));
            fmxFunction.setCyclomaticComplexity(currentCC[fmxFunction.getName()]);
            fmxFunction.setIsGeneric(isGeneric);
            fmxFunction.setFullyQualifiedName(functionFullyQualifiedName);
    
            let functionTypeName = this.UNKNOWN_VALUE;
            try {
                functionTypeName = func.getReturnType().getText().trim();
            } catch (error) {
                logger.error(`> WARNING: got exception ${error}. Failed to get usable name for return type of function: ${func.getName()}. Continuing...`);
            }
    
            const fmxType = this.createOrGetFamixType(functionTypeName, func);
            fmxFunction.setDeclaredType(fmxType);
            fmxFunction.setNumberOfLinesOfCode(func.getEndLineNumber() - func.getStartLineNumber());
            const parameters = func.getParameters();
            fmxFunction.setNumberOfParameters(parameters.length);
            fmxFunction.setNumberOfStatements(func.getStatements().length);
    
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
        fmxParam.setDeclaredType(fmxType);
        fmxParam.setName(param.getName());

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
   
        fmxParameterType.setName(tp.getName());      

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
        let fmxParameterType: Famix.Type | Famix.Class | Famix.Interface;

        let isClassOrInterface = false;
        if (this.fmxClassMap.has(parameterTypeName)){
            this.fmxClassMap.forEach((obj, name) => {
                if(obj instanceof Famix.ParametricClass){
                    if (name === param.getText() && obj.getGenericParameters().size>0) {
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
                    if (name === param.getText() && obj.getGenericParameters().size>0) {
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
                    fmxParameterType.setIsStub(true);
                } else {
                    fmxParameterType = new Famix.ParameterType();
                } 
    
                fmxParameterType.setName(parameterTypeName);
                this.famixRep.addElement(fmxParameterType);
                this.fmxTypeMap.set(parameterTypeName, fmxParameterType);
                this.fmxElementObjectMap.set(fmxParameterType,typeParameterDeclaration);
            }
            else {
                fmxParameterType = this.fmxTypeMap.get(parameterTypeName);
            }
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
        fmxVariable.setDeclaredType(fmxType);
        fmxVariable.setName(variable.getName());
    
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
        fmxEnum.setName(enumEntity.getName());

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
        fmxEnumValue.setDeclaredType(fmxType);
        fmxEnumValue.setName(enumMember.getName());

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

        fmxDecorator.setName(decoratorName);
        fmxDecorator.setDecoratorExpression(decoratorExpression);
        const decoratedEntityFullyQualifiedName = FQNFunctions.getFQN(decoratedEntity);
        const fmxDecoratedEntity = this.famixRep.getFamixEntityByFullyQualifiedName(decoratedEntityFullyQualifiedName) as Famix.NamedEntity;
        fmxDecorator.setDecoratedEntity(fmxDecoratedEntity);

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
        logger.debug(`> NOTE: creating comment ${comment.getText()} in scope ${fmxScope.getName()}.`);
        const fmxComment = new Famix.Comment();
        fmxComment.setContainer(fmxScope);  // adds comment to the container's comments collection
        fmxComment.setIsJSDoc(isJSDoc);

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
        let ancestor: Famix.ContainerEntity;
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
                fmxType.setIsStub(true);
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
                (fmxType as Famix.ParameterType).setBaseType(fmxBaseType);
            }
            else {
                fmxType = new Famix.Type();
            }

            fmxType.setName(typeName);
            fmxType.setContainer(ancestor);
            
            this.makeFamixIndexFileAnchor(element, fmxType);

            this.famixRep.addElement(fmxType);

            this.fmxTypeMap.set(typeName, fmxType);
        }
        else {
            fmxType = this.fmxTypeMap.get(typeName);
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

        logger.debug(`Creating FamixAccess. Node: [${node.getKindName()}] '${node.getText()}', id: ${id} refers to fmxVar '${fmxVar}'.`);

        const nodeReferenceAncestor = Helpers.findAncestor(node);
        const ancestorFullyQualifiedName = FQNFunctions.getFQN(nodeReferenceAncestor);
        let accessor = this.famixRep.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
        if (!accessor) {
            logger.error(`Ancestor ${ancestorFullyQualifiedName} not found.`);
            // accessor = this.createOrGetFamixType(ancestorFullyQualifiedName, nodeReferenceAncestor as TypeDeclaration);
        }

        const fmxAccess = new Famix.Access();
        fmxAccess.setAccessor(accessor);
        fmxAccess.setVariable(fmxVar);

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
        fmxInvocation.setSender(sender);
        fmxInvocation.setReceiver(receiver);
        fmxInvocation.addCandidate(fmxMethodOrFunction);
        fmxInvocation.setSignature(fmxMethodOrFunction.getSignature());

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
        let subClass: Famix.Class | Famix.Interface;
        if (cls instanceof ClassDeclaration) {
            subClass = this.fmxClassMap.get(classFullyQualifiedName);
        }
        else {
            subClass = this.fmxInterfaceMap.get(classFullyQualifiedName);
        }
        
        let inhClassName: string;
        let inhClassFullyQualifiedName: string;
        let superClass: Famix.Class | Famix.Interface;
        if (inhClass instanceof ClassDeclaration || inhClass instanceof InterfaceDeclaration) {
            inhClassName = inhClass.getName();
            inhClassFullyQualifiedName = FQNFunctions.getFQN(inhClass);
            if (inhClass instanceof ClassDeclaration) {
                superClass = this.fmxClassMap.get(inhClassFullyQualifiedName);
            }
            else {
                superClass = this.fmxInterfaceMap.get(inhClassFullyQualifiedName);
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

            superClass.setName(inhClassName);
            superClass.setFullyQualifiedName(inhClassFullyQualifiedName);
            superClass.setIsStub(true);

            this.makeFamixIndexFileAnchor(inhClass, superClass);
        
            this.famixRep.addElement(superClass);
        }

        fmxInheritance.setSubclass(subClass);
        fmxInheritance.setSuperclass(superClass);

        this.famixRep.addElement(fmxInheritance);

        this.fmxElementObjectMap.set(fmxInheritance,null);

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
    public createFamixImportClause(importClauseInfo: {importDeclaration?: ImportDeclaration | ImportEqualsDeclaration, importer: SourceFile, moduleSpecifierFilePath: string, importElement: ImportSpecifier | Identifier, isInExports: boolean, isDefaultExport: boolean}): void {
        const {importDeclaration, importer, moduleSpecifierFilePath, importElement, isInExports, isDefaultExport} = importClauseInfo;
        logger.debug(`createFamixImportClause: Creating import clause:`);
        const fmxImportClause = new Famix.ImportClause();

        let importedEntity: Famix.NamedEntity | Famix.StructuralEntity;
        let importedEntityName: string;

        const absolutePathProject = this.famixRep.getAbsolutePath();
        
        const absolutePath = path.normalize(moduleSpecifierFilePath);
        // convert the path and remove any windows backslashes introduced by path.normalize
        const pathInProject: string = this.convertToRelativePath(absolutePath, absolutePathProject).replace(/\\/g, "/");

        let pathName = "{" + pathInProject + "}.";

        // Named imports, e.g. import { ClassW } from "./complexExportModule";
        if (importDeclaration instanceof ImportDeclaration 
            && importElement instanceof ImportSpecifier) { 
                importedEntityName = importElement.getName();
            pathName = pathName + importedEntityName;
            if (isInExports) {
                importedEntity = this.famixRep.getFamixEntityByFullyQualifiedName(pathName) as Famix.NamedEntity;
            }
            if (importedEntity === undefined) {
                importedEntity = new Famix.NamedEntity();
                importedEntity.setName(importedEntityName);
                if (!isInExports) {
                    importedEntity.setIsStub(true);
                }
                this.makeFamixIndexFileAnchor(importElement, importedEntity);
                importedEntity.setFullyQualifiedName(pathName);
            }
        }
        // handle import equals declarations, e.g. import myModule = require("./complexExportModule");
        // TypeScript can't determine the type of the imported module, so we create a Module entity
        else if (importDeclaration instanceof ImportEqualsDeclaration) {
            importedEntityName = importDeclaration?.getName();
            pathName = pathName + importedEntityName;
            importedEntity = new Famix.StructuralEntity();
            importedEntity.setName(importedEntityName);
            this.makeFamixIndexFileAnchor(importElement, importedEntity);
            importedEntity.setFullyQualifiedName(pathName);
            const anyType = this.createOrGetFamixType('any', undefined);
            (importedEntity as Famix.StructuralEntity).setDeclaredType(anyType);
        } else {  // default imports, e.g. import ClassW from "./complexExportModule";  
            importedEntityName = importElement.getText();
            pathName = pathName + (isDefaultExport ? "defaultExport" : "namespaceExport");
            importedEntity = new Famix.NamedEntity();
            importedEntity.setName(importedEntityName);
            this.makeFamixIndexFileAnchor(importElement, importedEntity);
            importedEntity.setFullyQualifiedName(pathName);
        }

        this.famixRep.addElement(importedEntity);
        const importerFullyQualifiedName = FQNFunctions.getFQN(importer);
        const fmxImporter = this.famixRep.getFamixEntityByFullyQualifiedName(importerFullyQualifiedName) as Famix.Module;
        fmxImportClause.setImportingEntity(fmxImporter);
        fmxImportClause.setImportedEntity(importedEntity);
        if (importDeclaration instanceof ImportEqualsDeclaration) {
            fmxImportClause.setModuleSpecifier(importDeclaration?.getModuleReference().getText() as string);
        } else {
            fmxImportClause.setModuleSpecifier(importDeclaration?.getModuleSpecifierValue() as string);
        }
    
        logger.debug(`createFamixImportClause: ${fmxImportClause.getImportedEntity()?.getName()} (of type ${
            Helpers.getSubTypeName(fmxImportClause.getImportedEntity())}) is imported by ${fmxImportClause.getImportingEntity()?.getName()}`);

        fmxImporter.addOutgoingImport(fmxImportClause);

        this.famixRep.addElement(fmxImportClause);

        this.fmxElementObjectMap.set(fmxImportClause,importDeclaration);
    }

    /**
     * Creates a Famix Arrow Function
     * @param arrowExpression An Expression
     * @returns The Famix model of the variable
     */
    public createFamixArrowFunction(arrowExpression: Expression ,currentCC: unknown): Famix.ArrowFunction | Famix.ParametricArrowFunction {
        
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
            fmxArrowFunction.setName(functionName);
        }
        else {
            fmxArrowFunction.setName("anonymous");
        }

        // Signature of an arrow function is (parameters) => return_type
        const parametersSignature = arrowFunction.getParameters().map(p => p.getText()).join(", ");
        const returnTypeSignature = arrowFunction.getReturnType().getText();
        fmxArrowFunction.setSignature(`(${parametersSignature}) => ${returnTypeSignature}`);
        fmxArrowFunction.setCyclomaticComplexity(currentCC[fmxArrowFunction.getName()]);
        fmxArrowFunction.setIsGeneric(isGeneric);

        let functionTypeName = this.UNKNOWN_VALUE;
        try {
            functionTypeName = arrowFunction.getReturnType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for return type of function: ${functionName}. Continuing...`);
        }

        const fmxType = this.createOrGetFamixType(functionTypeName, arrowFunction as unknown as FunctionDeclaration);
        fmxArrowFunction.setDeclaredType(fmxType);
        fmxArrowFunction.setNumberOfLinesOfCode(arrowFunction.getEndLineNumber() - arrowFunction.getStartLineNumber());
        const parameters = arrowFunction.getParameters();
        fmxArrowFunction.setNumberOfParameters(parameters.length);
        fmxArrowFunction.setNumberOfStatements(arrowFunction.getStatements().length);

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
        
        fmxConcretisation.setConcreteEntity(conEntity);
        fmxConcretisation.setGenericEntity(genEntity);
        this.fmxElementObjectMap.set(fmxConcretisation,null);
        this.famixRep.addElement(fmxConcretisation);    
        const parameterConcretisation = this.createFamixParameterConcrestisation(fmxConcretisation);
            
        return fmxConcretisation;
    }

    /**
     * Creates a Famix concretisation
     * @param concretisation A FamixConcretisation
     * @returns The Famix model of the ParameterConcrestisation
     */
    public createFamixParameterConcrestisation(concretisation: Famix.Concretisation): Famix.ParameterConcretisation {
        const conClass = concretisation.getConcreteEntity();
        const genClass = concretisation.getGenericEntity();
        const parameterConcretisations = this.famixRep._getAllEntitiesWithType("ParameterConcretisation");
        const concreteParameters = conClass.getConcreteParameters();
        const genericParameters = genClass.getGenericParameters();
        
        let conClassTypeParametersIterator = concreteParameters.values();
        let genClassTypeParametersIterator = genericParameters.values();
        let fmxParameterConcretisation : Famix.ParameterConcretisation;

        for (let i = 0; i < genericParameters.size; i++) {
            const conClassTypeParameter = conClassTypeParametersIterator.next().value;
            const genClassTypeParameter = genClassTypeParametersIterator.next().value;
            let createParameterConcretisation : boolean = true;
            if(conClassTypeParameter && genClassTypeParameter && conClassTypeParameter.getName() != genClassTypeParameter.getName()){
                parameterConcretisations.forEach((param : Famix.ParameterConcretisation) => {
                    if (conClassTypeParameter.getName() == param.getConcreteParameter().getName() && genClassTypeParameter.getName() == param.getGenericParameter().getName()) {
                        createParameterConcretisation = false;
                        fmxParameterConcretisation = param;
                    }
                })
                if (createParameterConcretisation) {
                    fmxParameterConcretisation = new Famix.ParameterConcretisation();
                    fmxParameterConcretisation.setGenericParameter(genClassTypeParameter);
                    fmxParameterConcretisation.setConcreteParameter(conClassTypeParameter);
                    fmxParameterConcretisation.addConcretisation(concretisation);
                    this.fmxElementObjectMap.set(fmxParameterConcretisation,null);
                } else {
                    fmxParameterConcretisation.addConcretisation(concretisation);
                }
                this.famixRep.addElement(fmxParameterConcretisation);
            }
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
                        EntityDeclaration = entity.getExpression().getSymbol().getDeclarations()[0] as ClassDeclaration;
                        genEntity = this.createOrGetFamixClass(EntityDeclaration) as Famix.ParametricClass;
                    } else {
                        EntityDeclaration = entity.getExpression().getSymbol().getDeclarations()[0] as InterfaceDeclaration;
                        genEntity = this.createOrGetFamixInterface(EntityDeclaration) as Famix.ParametricInterface;
                    }
                    const genParams = EntityDeclaration.getTypeParameters().map((param) => param.getText());
                    const args = element.getHeritageClauses()[0].getTypeNodes()[0].getTypeArguments()
                    const conParams = element.getHeritageClauses()[0].getTypeNodes()[0].getTypeArguments().map((param) => param.getText());
                    if (!Helpers.arraysAreEqual(conParams,genParams)) {
                        let conEntity;
                        conEntity = this.createOrGetFamixConcreteElement(genEntity,EntityDeclaration,args);
                        const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation");
                        let createConcretisation : boolean = true;
                        concretisations.forEach((conc : Famix.Concretisation) => {
                            if (genEntity.getFullyQualifiedName() == conc.getGenericEntity().getFullyQualifiedName() && conc.getConcreteEntity().getFullyQualifiedName() == conEntity.getFullyQualifiedName()){
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
                        const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation");
                        let createConcretisation : boolean = true;
                        concretisations.forEach((conc : Famix.Concretisation) => {
                            if (genEntity.getFullyQualifiedName() == conc.getGenericEntity().getFullyQualifiedName() && conc.getConcreteEntity().getFullyQualifiedName() == conEntity.getFullyQualifiedName()){
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
                let currentNode = usage;

                while (currentNode) {
                    if (currentNode.getKind() === SyntaxKind.CallExpression) {
                        const callExpression = currentNode.asKind(SyntaxKind.CallExpression);
                        const instanceIsGeneric = callExpression.getTypeArguments().length > 0;
                        if (instanceIsGeneric) {
                            const args = callExpression.getTypeArguments();
                            const conParams = callExpression.getTypeArguments().map(param => param.getText());
                            if (!Helpers.arraysAreEqual(conParams,genParams)) {
                                let genElement;
                                if(element instanceof FunctionDeclaration){
                                    genElement = this.createOrGetFamixFunction(element,0) as Famix.ParametricFunction;
                                } else {
                                    genElement = this.createOrGetFamixMethod(element,0) as Famix.ParametricMethod;
                                }
                                let concElement;
                                concElement = this.createOrGetFamixConcreteElement(genElement,element,args);
                                const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation");
                                let createConcretisation : boolean = true;
                                concretisations.forEach((conc : Famix.Concretisation) => {
                                    if (genElement.getFullyQualifiedName() == conc.getGenericEntity().getFullyQualifiedName() && conc.getConcreteEntity().getFullyQualifiedName() == concElement.getFullyQualifiedName()){
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
                const interfaceDeclaration = interfaceType.getExpression().getSymbol().getDeclarations()[0] as InterfaceDeclaration;
                const genParams = interfaceDeclaration.getTypeParameters().map((param) => param.getText());
                const conParams = cls.getHeritageClauses()[0].getTypeNodes()[0].getTypeArguments().map((param) => param.getText());
                const args = cls.getHeritageClauses()[0].getTypeNodes()[0].getTypeArguments();
                if (!Helpers.arraysAreEqual(conParams,genParams)) {
                    const genInterface = this.createOrGetFamixInterface(interfaceDeclaration) as Famix.ParametricInterface;
                    const conInterface = this.createOrGetFamixConcreteElement(genInterface,interfaceDeclaration,args);
                    const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation");
                    let createConcretisation : boolean = true;
                    concretisations.forEach((conc : Famix.Concretisation) => {
                        if (genInterface.getFullyQualifiedName() == conc.getGenericEntity().getFullyQualifiedName() && conc.getConcreteEntity().getFullyQualifiedName() == conInterface.getFullyQualifiedName()){
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
                                const concretisations = this.famixRep._getAllEntitiesWithType("Concretisation");
                                let createConcretisation : boolean = true;
                                concretisations.forEach((conc : Famix.Concretisation) => {
                                    if (genElement.getFullyQualifiedName() == conc.getGenericEntity().getFullyQualifiedName() && conc.getConcreteEntity().getFullyQualifiedName() == concElement.getFullyQualifiedName()){
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