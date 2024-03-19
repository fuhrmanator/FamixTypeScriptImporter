import { ClassDeclaration, ConstructorDeclaration, FunctionDeclaration, Identifier, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, PropertyDeclaration, PropertySignature, SourceFile, TypeParameterDeclaration, VariableDeclaration, ParameterDeclaration, Decorator, GetAccessorDeclaration, SetAccessorDeclaration, ImportSpecifier, CommentRange, EnumDeclaration, EnumMember, TypeAliasDeclaration, FunctionExpression, ExpressionWithTypeArguments, ImportDeclaration, ImportEqualsDeclaration } from "ts-morph";
import * as Famix from "../lib/famix/src/model/famix";
import { FamixRepository } from "../lib/famix/src/famix_repository";
import { FQNFunctions } from "../fqn";
import { FamixFunctionsIndex } from "./famix_functions_index";
import { FamixFunctionsAssociations } from "./famix_functions_associations";
import { FamixFunctionsTypes } from "./famix_functions_types";
import { logger } from "../analyze";

/**
 * This class contains all the functions needed to create Famix entities
 */
export class FamixFunctions {

    private famixRep = new FamixRepository(); // The Famix repository
    private FQNFunctions = new FQNFunctions(); // The fully qualified name functions
    private fmxAliasMap = new Map<string, Famix.Alias>(); // Maps the alias names to their Famix model
    private fmxClassMap = new Map<string, Famix.Class | Famix.ParameterizableClass>(); // Maps the fully qualifiedclass names to their Famix model
    private fmxInterfaceMap = new Map<string, Famix.Interface | Famix.ParameterizableInterface>(); // Maps the interface names to their Famix model
    private fmxNamespaceMap = new Map<string, Famix.Namespace>(); // Maps the namespace names to their Famix model
    private fmxFileMap = new Map<string, Famix.ScriptEntity | Famix.Module>(); // Maps the source file names to their Famix model
    private famixFunctionsIndex = new FamixFunctionsIndex(this.famixRep); // FamixFunctionsIndex object, it contains all the functions needed to create Famix index file anchors
    private famixFunctionsAssociations = new FamixFunctionsAssociations(this.famixRep, this, this.fmxClassMap, this.fmxInterfaceMap); // FamixFunctionsAssociations object, it contains all the functions needed to create Famix associations
    private famixFunctionsTypes = new FamixFunctionsTypes(this.famixRep); // FamixFunctionsTypes object, it contains all the functions needed to create Famix types
    private UNKNOWN_VALUE = '(unknown due to parsing error)'; // The value to use when a name is not usable

    /**
     * Gets the Famix repository
     * @returns The Famix repository
     */
    public getFamixRepository(): FamixRepository {
        return this.famixRep;
    }

    /**
     * Creates or gets a Famix script entity or module
     * @param f A source file
     * @param isModule A boolean indicating if the source file is a module
     * @returns The Famix model of the source file
     */
    public createOrGetFamixFile(f: SourceFile, isModule: boolean): Famix.ScriptEntity | Famix.Module {
        let fmxFile: Famix.ScriptEntity | Famix.Module;
        const fileName = f.getBaseName();
        const fullyQualifiedFilename = f.getFilePath();
        if (!this.fmxFileMap.has(fullyQualifiedFilename)) {
            if (isModule) {
                fmxFile = new Famix.Module(this.famixRep); 
            }
            else {
                fmxFile = new Famix.ScriptEntity(this.famixRep);
            }
            fmxFile.setName(fileName);
            fmxFile.setNumberOfLinesOfText(f.getEndLineNumber() - f.getStartLineNumber());
            fmxFile.setNumberOfCharacters(f.getFullText().length);

            this.famixFunctionsIndex.makeFamixIndexFileAnchor(f, fmxFile);

            this.fmxFileMap.set(fullyQualifiedFilename, fmxFile);
        }
        else {
            fmxFile = this.fmxFileMap.get(fullyQualifiedFilename);
        }
        return fmxFile;
    }

    /**
     * Creates or gets a Famix namespace
     * @param m A namespace
     * @returns The Famix model of the namespace
     */
    public createOrGetFamixNamespace(m: ModuleDeclaration): Famix.Namespace {
        let fmxNamespace: Famix.Namespace;
        const namespaceName = m.getName();
        if (!this.fmxNamespaceMap.has(namespaceName)) {
            fmxNamespace = new Famix.Namespace(this.famixRep);
            fmxNamespace.setName(namespaceName);

            this.famixFunctionsIndex.makeFamixIndexFileAnchor(m, fmxNamespace);

            this.fmxNamespaceMap.set(namespaceName, fmxNamespace);
        }
        else {
            fmxNamespace = this.fmxNamespaceMap.get(namespaceName);
        }
        return fmxNamespace;
    }

    /**
     * Creates a Famix alias
     * @param a An alias
     * @returns The Famix model of the alias
     */
    public createFamixAlias(a: TypeAliasDeclaration): Famix.Alias {
        let fmxAlias: Famix.Alias;
        const aliasName = a.getName();
        const aliasFullyQualifiedName = a.getType().getText(); // this.FQNFunctions.getFQN(a);
        if (!this.fmxAliasMap.has(aliasFullyQualifiedName)) {
            fmxAlias = new Famix.Alias(this.famixRep);
            fmxAlias.setName(a.getName());
            const aliasNameWithGenerics = aliasName + (a.getTypeParameters().length ? ("<" + a.getTypeParameters().map(tp => tp.getName()).join(", ") + ">") : "");
            logger.debug(`> NOTE: alias ${aliasName} has fully qualified name ${aliasFullyQualifiedName} and name with generics ${aliasNameWithGenerics}.`);

            const fmxType = this.createOrGetFamixType(aliasNameWithGenerics, a);
            fmxAlias.setAliasedEntity(fmxType);

            this.famixFunctionsIndex.makeFamixIndexFileAnchor(a, fmxAlias);

            this.fmxAliasMap.set(aliasFullyQualifiedName, fmxAlias);
        }
        else {
            fmxAlias = this.fmxAliasMap.get(aliasFullyQualifiedName);
        }
        return fmxAlias;
    }

    /**
     * Creates or gets a Famix class or parameterizable class
     * @param cls A class
     * @returns The Famix model of the class
     */
    public createOrGetFamixClass(cls: ClassDeclaration): Famix.Class | Famix.ParameterizableClass {
        let fmxClass: Famix.Class | Famix.ParameterizableClass;
        const isAbstract = cls.isAbstract();
        const classFullyQualifiedName = this.FQNFunctions.getFQN(cls);
        const clsName = cls.getName();
        if (!this.fmxClassMap.has(classFullyQualifiedName)) {
            const isGeneric = cls.getTypeParameters().length;
            if (isGeneric) {
                fmxClass = new Famix.ParameterizableClass(this.famixRep);
            }
            else {
                fmxClass = new Famix.Class(this.famixRep);
            }

            fmxClass.setName(clsName);
            fmxClass.setFullyQualifiedName(classFullyQualifiedName);
            fmxClass.setIsAbstract(isAbstract);

            this.famixFunctionsIndex.makeFamixIndexFileAnchor(cls, fmxClass);

            this.fmxClassMap.set(classFullyQualifiedName, fmxClass);
        }
        else {
            fmxClass = this.fmxClassMap.get(classFullyQualifiedName) as (Famix.Class | Famix.ParameterizableClass);
        }
        return fmxClass;
    }

    /**
     * Creates or gets a Famix interface or parameterizable interface
     * @param inter An interface
     * @returns The Famix model of the interface
     */
    public createOrGetFamixInterface(inter: InterfaceDeclaration): Famix.Interface | Famix.ParameterizableInterface {
        let fmxInterface: Famix.Interface | Famix.ParameterizableInterface;
        const interName = inter.getName();
        const interFullyQualifiedName = this.FQNFunctions.getFQN(inter);
        if (!this.fmxInterfaceMap.has(interName)) {
            const isGeneric = inter.getTypeParameters().length;
            if (isGeneric) {
                fmxInterface = new Famix.ParameterizableInterface(this.famixRep);
            }
            else {
                fmxInterface = new Famix.Interface(this.famixRep);
            }

            fmxInterface.setName(interName);

            this.famixFunctionsIndex.makeFamixIndexFileAnchor(inter, fmxInterface);

            this.fmxInterfaceMap.set(interFullyQualifiedName, fmxInterface);
        }
        else {
            fmxInterface = this.fmxInterfaceMap.get(interName) as (Famix.Interface | Famix.ParameterizableInterface);
        }
        return fmxInterface;
    }

    /**
     * Creates a Famix property
     * @param property A property
     * @returns The Famix model of the property
     */
    public createFamixProperty(property: PropertyDeclaration | PropertySignature): Famix.Property {
        const fmxProperty = new Famix.Property(this.famixRep);
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

        property.getModifiers().forEach(m => fmxProperty.addModifier(m.getText()));
        if (!isSignature && property.getExclamationTokenNode()) {
            fmxProperty.addModifier("!");
        }
        if (property.getQuestionTokenNode()) {
            fmxProperty.addModifier("?");
        }
        if (property.getName().substring(0, 1) === "#") {
            fmxProperty.addModifier("#");
        }

        if (fmxProperty.getModifiers().has("static")) {
            fmxProperty.setIsClassSide(true);
        }
        else {
            fmxProperty.setIsClassSide(false);
        }

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(property, fmxProperty);

        return fmxProperty;
    }

    /**
     * Creates a Famix method or accessor
     * @param method A method or an accessor
     * @param currentCC The cyclomatic complexity metrics of the current source file
     * @returns The Famix model of the method or the accessor
     */
    public createFamixMethod(method: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration, currentCC: unknown): Famix.Method | Famix.Accessor {
        let fmxMethod: Famix.Method | Famix.Accessor;
        if (method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) {
            fmxMethod = new Famix.Accessor(this.famixRep);
            const isGetter = method instanceof GetAccessorDeclaration;
            const isSetter = method instanceof SetAccessorDeclaration;
            if (isGetter) {(fmxMethod as Famix.Accessor).setKind("getter");}
            if (isSetter) {(fmxMethod as Famix.Accessor).setKind("setter");}
        }
        else {
            fmxMethod = new Famix.Method(this.famixRep);
        }
        const isConstructor = method instanceof ConstructorDeclaration;
        const isSignature = method instanceof MethodSignature;
        const isGeneric = method.getTypeParameters().length > 0;
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
        fmxMethod.setSignature(this.computeSignature(method.getText()));

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
        
        this.famixFunctionsIndex.makeFamixIndexFileAnchor(method, fmxMethod);

        return fmxMethod;
    }

    /**
     * Creates a Famix function
     * @param func A function
     * @param currentCC The cyclomatic complexity metrics of the current source file
     * @returns The Famix model of the function
     */
    public createFamixFunction(func: FunctionDeclaration | FunctionExpression, currentCC: unknown): Famix.Function {
        const fmxFunction = new Famix.Function(this.famixRep);
        if (func.getName()) {
            fmxFunction.setName(func.getName());
        }
        else {
            fmxFunction.setName("anonymous");
        }
        fmxFunction.setSignature(this.computeSignature(func.getText()));
        fmxFunction.setCyclomaticComplexity(currentCC[fmxFunction.getName()]);
        const isGeneric = func.getTypeParameters().length > 0;
        fmxFunction.setIsGeneric(isGeneric);

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

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(func, fmxFunction);

        return fmxFunction;
    }

    /**
     * Creates a Famix parameter
     * @param param A parameter
     * @returns The Famix model of the parameter
     */
    public createFamixParameter(param: ParameterDeclaration): Famix.Parameter {
        const fmxParam = new Famix.Parameter(this.famixRep);

        let paramTypeName = this.UNKNOWN_VALUE;
        try {
            paramTypeName = param.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for parameter: ${param.getName()}. Continuing...`);
        }

        const fmxType = this.createOrGetFamixType(paramTypeName, param);
        fmxParam.setDeclaredType(fmxType);
        fmxParam.setName(param.getName());

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(param, fmxParam);

        return fmxParam;
    }

    /**
     * Creates a Famix type parameter
     * @param tp A type parameter
     * @returns The Famix model of the type parameter
     */
    public createFamixParameterType(tp: TypeParameterDeclaration): Famix.ParameterType {
        const fmxParameterType = new Famix.ParameterType(this.famixRep);
        fmxParameterType.setName(tp.getName());

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(tp, fmxParameterType);

        return fmxParameterType;
    }

    /**
     * Creates a Famix variable
     * @param variable A variable
     * @returns The Famix model of the variable
     */
    public createFamixVariable(variable: VariableDeclaration): Famix.Variable {
        const fmxVariable = new Famix.Variable(this.famixRep);

        let variableTypeName = this.UNKNOWN_VALUE;
        try {
            variableTypeName = variable.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for variable: ${variable.getName()}. Continuing...`);
        }

        const fmxType = this.createOrGetFamixType(variableTypeName, variable);
        fmxVariable.setDeclaredType(fmxType);
        fmxVariable.setName(variable.getName());

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(variable, fmxVariable);

        return fmxVariable;
    }

    /**
     * Creates a Famix enum
     * @param enumEntity An enum
     * @returns The Famix model of the enum
     */
    public createFamixEnum(enumEntity: EnumDeclaration): Famix.Enum {
        const fmxEnum = new Famix.Enum(this.famixRep);
        fmxEnum.setName(enumEntity.getName());

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(enumEntity, fmxEnum);

        return fmxEnum;
    }

    /**
     * Creates a Famix enum value
     * @param enumMember An enum member
     * @returns The Famix model of the enum member
     */
    public createFamixEnumValue(enumMember: EnumMember): Famix.EnumValue {
        const fmxEnumValue = new Famix.EnumValue(this.famixRep);

        let enumValueTypeName = this.UNKNOWN_VALUE;
        try {
            enumValueTypeName = enumMember.getType().getText().trim();
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Failed to get usable name for enum value: ${enumMember.getName()}. Continuing...`);
        }

        const fmxType = this.createOrGetFamixType(enumValueTypeName, enumMember);
        fmxEnumValue.setDeclaredType(fmxType);
        fmxEnumValue.setName(enumMember.getName());

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(enumMember, fmxEnumValue);

        return fmxEnumValue;
    }

    /**
     * Creates or gets a Famix decorator
     * @param decorator A decorator
     * @param decoratedEntity A class, a method, a parameter or a property
     * @returns The Famix model of the decorator
     */
    public createOrGetFamixDecorator(decorator: Decorator, decoratedEntity: ClassDeclaration | MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ParameterDeclaration | PropertyDeclaration): Famix.Decorator {
        const fmxDecorator = new Famix.Decorator(this.famixRep);
        const decoratorName = "@" + decorator.getName();
        const decoratorExpression = decorator.getText().substring(1);

        fmxDecorator.setName(decoratorName);
        fmxDecorator.setDecoratorExpression(decoratorExpression);
        const decoratedEntityFullyQualifiedName = this.FQNFunctions.getFQN(decoratedEntity);
        const fmxDecoratedEntity = this.getFamixEntityByFullyQualifiedName(decoratedEntityFullyQualifiedName) as Famix.NamedEntity;
        fmxDecorator.setDecoratedEntity(fmxDecoratedEntity);

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(decorator, fmxDecorator);

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
        const fmxComment = new Famix.Comment(this.famixRep);
        fmxComment.setContainer(fmxScope);  // adds comment to the container's comments collection
        fmxComment.setIsJSDoc(isJSDoc);

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(comment, fmxComment);

        return fmxComment;
    }

    /**
     * Creates or gets a Famix type
     * @param typeName A type name
     * @param element A ts-morph element
     * @returns The Famix model of the type
     */
    public createOrGetFamixType(typeName: string, element: TypeAliasDeclaration | PropertyDeclaration | PropertySignature | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | EnumMember): Famix.Type | Famix.PrimitiveType | Famix.ParameterizedType {
        return this.famixFunctionsTypes.createOrGetFamixType(typeName, element);
    }

    /**
     * Creates a Famix access
     * @param node A node
     * @param id An id of a parameter, a variable, a property or an enum member
     */
    public createFamixAccess(node: Identifier, id: number): void {
        this.famixFunctionsAssociations.createFamixAccess(node, id);
    }

    /**
     * Creates a Famix invocation
     * @param node A node
     * @param m A method or a function
     * @param id The id of the method or the function
     */
    public createFamixInvocation(node: Identifier, m: MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, id: number): void {
        this.famixFunctionsAssociations.createFamixInvocation(node, m, id);
    }

    /**
     * Creates a Famix inheritance
     * @param cls A class or an interface (subclass)
     * @param inhClass The inherited class or interface (superclass)
     */
    public createFamixInheritance(cls: ClassDeclaration | InterfaceDeclaration, inhClass: ClassDeclaration | InterfaceDeclaration | ExpressionWithTypeArguments): void {
        this.famixFunctionsAssociations.createFamixInheritance(cls, inhClass);
    }

    /**
     * Creates a Famix import clause
     * @param importClauseInfo An import clause
     * @param importDeclaration An import declaration (optional)
     * @param importer A source file which is a module
     * @param moduleSpecifier The name of the module where the export declaration is
     * @param moduleSpecifierFilePath The path of the module where the export declaration is
     * @param importElement The imported entity
     * @param isInExports A boolean indicating if the imported entity is in the exports
     * @param isDefaultExport A boolean indicating if the imported entity is a default export
     */    
    public createFamixImportClause(importClauseInfo: {importDeclaration?: ImportDeclaration | ImportEqualsDeclaration, importer: SourceFile, moduleSpecifierFilePath: string, importElement: ImportSpecifier | Identifier, isInExports: boolean, isDefaultExport: boolean}): void {
        this.famixFunctionsAssociations.createFamixImportClause(importClauseInfo);
    }

    /**
     * Gets a Famix entity by fully qualified name
     * @param fullyQualifiedName A fully qualified name
     * @returns The Famix entity corresponding to the fully qualified name
     */
    private getFamixEntityByFullyQualifiedName(fullyQualifiedName: string): Famix.Entity {
        return this.famixRep.getFamixEntityByFullyQualifiedName(fullyQualifiedName) as Famix.Entity;
    }

    /**
     * Gets the signature of a method or a function
     * @param text A method or a function source code
     * @returns The signature of the method or the function
     */
    private computeSignature(text: string): string {
        const endSignatureText = text.indexOf("{");
        return text.substring(0, endSignatureText).trim();
    }
}
