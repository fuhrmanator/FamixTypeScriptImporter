import { ClassDeclaration, ConstructorDeclaration, FunctionDeclaration, Identifier, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, PropertyDeclaration, PropertySignature, SourceFile, TypeParameterDeclaration, VariableDeclaration, ParameterDeclaration, Decorator, GetAccessorDeclaration, SetAccessorDeclaration, ImportSpecifier, CommentRange, EnumDeclaration, EnumMember, TypeAliasDeclaration, FunctionExpression, ExpressionWithTypeArguments, ImportDeclaration } from "ts-morph";
import * as Famix from "../lib/famix/src/model/famix";
import { logger, config } from "../analyze";
import GraphemeSplitter from "grapheme-splitter";
import * as Helpers from "./helpers_creation";
import * as FQNFunctions from "../fqn";
import { FamixRepository } from "../lib/famix/src/famix_repository";

// Famix repository instance
export const famixRep = new FamixRepository();
const fmxAliasMap = new Map<string, Famix.Alias>(); // Maps the alias names to their Famix model
const fmxClassMap = new Map<string, Famix.Class | Famix.ParameterizableClass>(); // Maps the fully qualifiedclass names to their Famix model
const fmxInterfaceMap = new Map<string, Famix.Interface | Famix.ParameterizableInterface>(); // Maps the interface names to their Famix model
const fmxNamespaceMap = new Map<string, Famix.Namespace>(); // Maps the namespace names to their Famix model
const fmxFileMap = new Map<string, Famix.ScriptEntity | Famix.Module>(); // Maps the source file names to their Famix model
const fmxTypeMap = new Map<string, Famix.Type | Famix.PrimitiveType | Famix.ParameterizedType>(); // Maps the type names to their Famix model

const UNKNOWN_VALUE = '(unknown due to parsing error)'; // The value to use when a name is not usable

/**
 * Makes a Famix index file anchor
 * @param sourceElement A source element
 * @param famixElement The Famix model of the source element
 */
export function makeFamixIndexFileAnchor(sourceElement: ImportDeclaration | SourceFile | ModuleDeclaration | ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | PropertyDeclaration | PropertySignature | TypeParameterDeclaration | Identifier | Decorator | GetAccessorDeclaration | SetAccessorDeclaration | ImportSpecifier | CommentRange | EnumDeclaration | EnumMember | TypeAliasDeclaration | ExpressionWithTypeArguments, famixElement: Famix.SourcedEntity): void {
    logger.debug("making index file anchor for '" + sourceElement?.getText() + "' with famixElement " + famixElement.getJSON());
    const fmxIndexFileAnchor = new Famix.IndexedFileAnchor(famixRep);
    fmxIndexFileAnchor.setElement(famixElement);

    if (sourceElement !== null) {
        const absolutePathProject = famixRep.getAbsolutePath();
    
        const path = require('path');

        const absolutePath = path.normalize(sourceElement.getSourceFile().getFilePath());

        const positionNodeModules = absolutePath.indexOf('node_modules');

        var pathInProject: string = "";

        if (positionNodeModules !== -1) {

            const pathFromNodeModules = absolutePath.substring(positionNodeModules);

            pathInProject = pathFromNodeModules

        } else {

            pathInProject = absolutePath.replace(absolutePathProject, "");

            pathInProject = pathInProject.slice(1);    
        
        }

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

        if (!(famixElement instanceof Famix.Association) && !(famixElement instanceof Famix.Comment) && !(sourceElement instanceof CommentRange) && !(sourceElement instanceof Identifier) && !(sourceElement instanceof ImportSpecifier) && !(sourceElement instanceof ExpressionWithTypeArguments)) {
            (famixElement as Famix.NamedEntity).setFullyQualifiedName(FQNFunctions.getFQN(sourceElement));
        }
    } else {
        // sourceElement is null
        logger.warn("sourceElement is null for famixElement " + famixElement.getJSON());
        fmxIndexFileAnchor.setFileName("unknown");
        fmxIndexFileAnchor.setStartPos(0);
        fmxIndexFileAnchor.setEndPos(0);
    }
}

/**
 * Creates or gets a Famix script entity or module
 * @param f A source file
 * @param isModule A boolean indicating if the source file is a module
 * @returns The Famix model of the source file
 */
export function createOrGetFamixFile(f: SourceFile, isModule: boolean): Famix.ScriptEntity | Famix.Module {
    let fmxFile: Famix.ScriptEntity | Famix.Module;
    const fileName = f.getBaseName();
    const fullyQualifiedFilename = f.getFilePath();
    if (!fmxFileMap.has(fullyQualifiedFilename)) {
        if (isModule) {
            fmxFile = new Famix.Module(famixRep); 
        }
        else {
            fmxFile = new Famix.ScriptEntity(famixRep);
        }
        fmxFile.setName(fileName);
        fmxFile.setNumberOfLinesOfText(f.getEndLineNumber() - f.getStartLineNumber());
        fmxFile.setNumberOfCharacters(f.getFullText().length);

        makeFamixIndexFileAnchor(f, fmxFile);

        fmxFileMap.set(fullyQualifiedFilename, fmxFile);
    }
    else {
        fmxFile = fmxFileMap.get(fullyQualifiedFilename);
    }

    return fmxFile;
}

/**
 * Creates or gets a Famix namespace
 * @param m A namespace
 * @returns The Famix model of the namespace
 */
export function createOrGetFamixNamespace(m: ModuleDeclaration): Famix.Namespace {
    let fmxNamespace: Famix.Namespace;
    const namespaceName = m.getName();
    if (!fmxNamespaceMap.has(namespaceName)) {
        fmxNamespace = new Famix.Namespace(famixRep);
        fmxNamespace.setName(namespaceName);

        makeFamixIndexFileAnchor(m, fmxNamespace);

        fmxNamespaceMap.set(namespaceName, fmxNamespace);
    }
    else {
        fmxNamespace = fmxNamespaceMap.get(namespaceName);
    }
    return fmxNamespace;
}

/**
 * Creates a Famix alias
 * @param a An alias
 * @returns The Famix model of the alias
 */
export function createFamixAlias(a: TypeAliasDeclaration): Famix.Alias {
    let fmxAlias: Famix.Alias;
    const aliasName = a.getName();
    const aliasFullyQualifiedName = a.getType().getText(); // FQNFunctions.getFQN(a);
    if (!fmxAliasMap.has(aliasFullyQualifiedName)) {
        fmxAlias = new Famix.Alias(famixRep);
        fmxAlias.setName(a.getName());
        const aliasNameWithGenerics = aliasName + (a.getTypeParameters().length ? ("<" + a.getTypeParameters().map(tp => tp.getName()).join(", ") + ">") : "");
        logger.debug(`> NOTE: alias ${aliasName} has fully qualified name ${aliasFullyQualifiedName} and name with generics ${aliasNameWithGenerics}.`);

        const fmxType = createOrGetFamixType(aliasNameWithGenerics, a);
        fmxAlias.setAliasedEntity(fmxType);

        makeFamixIndexFileAnchor(a, fmxAlias);

        fmxAliasMap.set(aliasFullyQualifiedName, fmxAlias);
    }
    else {
        fmxAlias = fmxAliasMap.get(aliasFullyQualifiedName);
    }
    return fmxAlias;
}

/**
 * Creates or gets a Famix class or parameterizable class
 * @param cls A class
 * @returns The Famix model of the class
 */
export function createOrGetFamixClass(cls: ClassDeclaration): Famix.Class | Famix.ParameterizableClass {
    let fmxClass: Famix.Class | Famix.ParameterizableClass;
    const isAbstract = cls.isAbstract();
    const classFullyQualifiedName = FQNFunctions.getFQN(cls);
    const clsName = cls.getName();
    if (!fmxClassMap.has(classFullyQualifiedName)) {
        const isGeneric = cls.getTypeParameters().length;
        if (isGeneric) {
            fmxClass = new Famix.ParameterizableClass(famixRep);
        }
        else {
            fmxClass = new Famix.Class(famixRep);
        }

        fmxClass.setName(clsName);
        fmxClass.setFullyQualifiedName(classFullyQualifiedName);
        fmxClass.setIsAbstract(isAbstract);

        makeFamixIndexFileAnchor(cls, fmxClass);

        fmxClassMap.set(classFullyQualifiedName, fmxClass);
    }
    else {
        fmxClass = fmxClassMap.get(classFullyQualifiedName) as (Famix.Class | Famix.ParameterizableClass);
    }
    return fmxClass;
}

/**
 * Creates or gets a Famix interface or parameterizable interface
 * @param inter An interface
 * @returns The Famix model of the interface
 */
export function createOrGetFamixInterface(inter: InterfaceDeclaration): Famix.Interface | Famix.ParameterizableInterface {
    let fmxInterface: Famix.Interface | Famix.ParameterizableInterface;
    const interName = inter.getName();
    const interFullyQualifiedName = FQNFunctions.getFQN(inter);
    if (!fmxInterfaceMap.has(interName)) {
        const isGeneric = inter.getTypeParameters().length;
        if (isGeneric) {
            fmxInterface = new Famix.ParameterizableInterface(famixRep);
        }
        else {
            fmxInterface = new Famix.Interface(famixRep);
        }

        fmxInterface.setName(interName);

        makeFamixIndexFileAnchor(inter, fmxInterface);

        fmxInterfaceMap.set(interFullyQualifiedName, fmxInterface);
    }
    else {
        fmxInterface = fmxInterfaceMap.get(interName) as (Famix.Interface | Famix.ParameterizableInterface);
    }
    return fmxInterface;
}

/**
 * Creates a Famix property
 * @param property A property
 * @returns The Famix model of the property
 */
export function createFamixProperty(property: PropertyDeclaration | PropertySignature): Famix.Property {
    const fmxProperty = new Famix.Property(famixRep);
    const isSignature = property instanceof PropertySignature;
    fmxProperty.setName(property.getName());

    let propTypeName = UNKNOWN_VALUE;
    try {
        propTypeName = property.getType().getText().trim();
    } catch (error) {
        logger.error(`> WARNING: got exception ${error}. Failed to get usable name for property: ${property.getName()}. Continuing...`);
    }

    const fmxType = createOrGetFamixType(propTypeName, property);
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

    makeFamixIndexFileAnchor(property, fmxProperty);

    return fmxProperty;
}

/**
 * Creates a Famix method or accessor
 * @param method A method or an accessor
 * @param currentCC The cyclomatic complexity metrics of the current source file
 * @returns The Famix model of the method or the accessor
 */
export function createFamixMethod(method: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration, currentCC: unknown): Famix.Method | Famix.Accessor {
    let fmxMethod: Famix.Method | Famix.Accessor;
    if (method instanceof GetAccessorDeclaration || method instanceof SetAccessorDeclaration) {
        fmxMethod = new Famix.Accessor(famixRep);
        const isGetter = method instanceof GetAccessorDeclaration;
        const isSetter = method instanceof SetAccessorDeclaration;
        if (isGetter) {(fmxMethod as Famix.Accessor).setKind("getter");}
        if (isSetter) {(fmxMethod as Famix.Accessor).setKind("setter");}
    }
    else {
        fmxMethod = new Famix.Method(famixRep);
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

    let methodTypeName = UNKNOWN_VALUE; 
    try {
        methodTypeName = method.getReturnType().getText().trim();            
    } catch (error) {
        logger.error(`> WARNING: got exception ${error}. Failed to get usable name for return type of method: ${fmxMethod.getName()}. Continuing...`);
    }

    const fmxType = createOrGetFamixType(methodTypeName, method);
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
    
    makeFamixIndexFileAnchor(method, fmxMethod);

    return fmxMethod;
}

/**
 * Creates a Famix function
 * @param func A function
 * @param currentCC The cyclomatic complexity metrics of the current source file
 * @returns The Famix model of the function
 */
export function createFamixFunction(func: FunctionDeclaration | FunctionExpression, currentCC: unknown): Famix.Function {
    const fmxFunction = new Famix.Function(famixRep);
    if (func.getName()) {
        fmxFunction.setName(func.getName());
    }
    else {
        fmxFunction.setName("anonymous");
    }
    fmxFunction.setSignature(Helpers.computeSignature(func.getText()));
    fmxFunction.setCyclomaticComplexity(currentCC[fmxFunction.getName()]);
    const isGeneric = func.getTypeParameters().length > 0;
    fmxFunction.setIsGeneric(isGeneric);

    let functionTypeName = UNKNOWN_VALUE;
    try {
        functionTypeName = func.getReturnType().getText().trim();
    } catch (error) {
        logger.error(`> WARNING: got exception ${error}. Failed to get usable name for return type of function: ${func.getName()}. Continuing...`);
    }

    const fmxType = createOrGetFamixType(functionTypeName, func);
    fmxFunction.setDeclaredType(fmxType);
    fmxFunction.setNumberOfLinesOfCode(func.getEndLineNumber() - func.getStartLineNumber());
    const parameters = func.getParameters();
    fmxFunction.setNumberOfParameters(parameters.length);
    fmxFunction.setNumberOfStatements(func.getStatements().length);

    makeFamixIndexFileAnchor(func, fmxFunction);

    return fmxFunction;
}

/**
 * Creates a Famix parameter
 * @param param A parameter
 * @returns The Famix model of the parameter
 */
export function createFamixParameter(param: ParameterDeclaration): Famix.Parameter {
    const fmxParam = new Famix.Parameter(famixRep);

    let paramTypeName = UNKNOWN_VALUE;
    try {
        paramTypeName = param.getType().getText().trim();
    } catch (error) {
        logger.error(`> WARNING: got exception ${error}. Failed to get usable name for parameter: ${param.getName()}. Continuing...`);
    }

    const fmxType = createOrGetFamixType(paramTypeName, param);
    fmxParam.setDeclaredType(fmxType);
    fmxParam.setName(param.getName());

    makeFamixIndexFileAnchor(param, fmxParam);

    return fmxParam;
}

/**
 * Creates a Famix type parameter
 * @param tp A type parameter
 * @returns The Famix model of the type parameter
 */
export function createFamixParameterType(tp: TypeParameterDeclaration): Famix.ParameterType {
    const fmxParameterType = new Famix.ParameterType(famixRep);
    fmxParameterType.setName(tp.getName());

    makeFamixIndexFileAnchor(tp, fmxParameterType);

    return fmxParameterType;
}

/**
 * Creates a Famix variable
 * @param variable A variable
 * @returns The Famix model of the variable
 */
export function createFamixVariable(variable: VariableDeclaration): Famix.Variable {
    const fmxVariable = new Famix.Variable(famixRep);

    let variableTypeName = UNKNOWN_VALUE;
    try {
        variableTypeName = variable.getType().getText().trim();
    } catch (error) {
        logger.error(`> WARNING: got exception ${error}. Failed to get usable name for variable: ${variable.getName()}. Continuing...`);
    }

    const fmxType = createOrGetFamixType(variableTypeName, variable);
    fmxVariable.setDeclaredType(fmxType);
    fmxVariable.setName(variable.getName());

    makeFamixIndexFileAnchor(variable, fmxVariable);

    return fmxVariable;
}

/**
 * Creates a Famix enum
 * @param enumEntity An enum
 * @returns The Famix model of the enum
 */
export function createFamixEnum(enumEntity: EnumDeclaration): Famix.Enum {
    const fmxEnum = new Famix.Enum(famixRep);
    fmxEnum.setName(enumEntity.getName());

    makeFamixIndexFileAnchor(enumEntity, fmxEnum);

    return fmxEnum;
}

/**
 * Creates a Famix enum value
 * @param enumMember An enum member
 * @returns The Famix model of the enum member
 */
export function createFamixEnumValue(enumMember: EnumMember): Famix.EnumValue {
    const fmxEnumValue = new Famix.EnumValue(famixRep);

    let enumValueTypeName = UNKNOWN_VALUE;
    try {
        enumValueTypeName = enumMember.getType().getText().trim();
    } catch (error) {
        logger.error(`> WARNING: got exception ${error}. Failed to get usable name for enum value: ${enumMember.getName()}. Continuing...`);
    }

    const fmxType = createOrGetFamixType(enumValueTypeName, enumMember);
    fmxEnumValue.setDeclaredType(fmxType);
    fmxEnumValue.setName(enumMember.getName());

    makeFamixIndexFileAnchor(enumMember, fmxEnumValue);

    return fmxEnumValue;
}

/**
 * Creates or gets a Famix decorator
 * @param decorator A decorator
 * @param decoratedEntity A class, a method, a parameter or a property
 * @returns The Famix model of the decorator
 */
export function createOrGetFamixDecorator(decorator: Decorator, decoratedEntity: ClassDeclaration | MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ParameterDeclaration | PropertyDeclaration): Famix.Decorator {
    const fmxDecorator = new Famix.Decorator(famixRep);
    const decoratorName = "@" + decorator.getName();
    const decoratorExpression = decorator.getText().substring(1);

    fmxDecorator.setName(decoratorName);
    fmxDecorator.setDecoratorExpression(decoratorExpression);
    const decoratedEntityFullyQualifiedName = FQNFunctions.getFQN(decoratedEntity);
    const fmxDecoratedEntity = famixRep.getFamixEntityByFullyQualifiedName(decoratedEntityFullyQualifiedName) as Famix.NamedEntity;
    fmxDecorator.setDecoratedEntity(fmxDecoratedEntity);

    makeFamixIndexFileAnchor(decorator, fmxDecorator);

    return fmxDecorator;
}

/**
 * Creates a Famix comment
 * @param comment A comment
 * @param fmxScope The Famix model of the comment's container
 * @param isJSDoc A boolean indicating if the comment is a JSDoc
 * @returns The Famix model of the comment
 */
export function createFamixComment(comment: CommentRange, fmxScope: Famix.NamedEntity, isJSDoc: boolean): Famix.Comment {
    logger.debug(`> NOTE: creating comment ${comment.getText()} in scope ${fmxScope.getName()}.`);
    const fmxComment = new Famix.Comment(famixRep);
    fmxComment.setContainer(fmxScope);  // adds comment to the container's comments collection
    fmxComment.setIsJSDoc(isJSDoc);

    makeFamixIndexFileAnchor(comment, fmxComment);

    return fmxComment;
}

/**
 * Creates or gets a Famix type
 * @param typeName A type name
 * @param element A ts-morph element
 * @returns The Famix model of the type
 */
export function createOrGetFamixType(typeName: string, element: TypeAliasDeclaration | PropertyDeclaration | PropertySignature | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | EnumMember): Famix.Type | Famix.PrimitiveType | Famix.ParameterizedType {
    let fmxType: Famix.Type | Famix.PrimitiveType | Famix.ParameterizedType;
    let isPrimitiveType = false;
    let isParameterizedType = false;

    logger.debug("Creating (or getting) type: '" + typeName + "' of element: " + element.getText() + " of kind: " + element.getKindName());

    const typeAncestor = Helpers.findTypeAncestor(element);
    const ancestorFullyQualifiedName = FQNFunctions.getFQN(typeAncestor);
    const ancestor = famixRep.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
    if (!ancestor) {
        throw new Error(`Ancestor ${ancestorFullyQualifiedName} not found.`);
    }

    if (typeName === "number" || typeName === "string" || typeName === "boolean" || typeName === "bigint" || typeName === "symbol" || typeName === "undefined" || typeName === "null" || typeName === "any" || typeName === "unknown" || typeName === "never" || typeName === "void") {
        isPrimitiveType = true;
    }

    if(!isPrimitiveType && typeName.includes("<") && typeName.includes(">") && !(typeName.includes("=>"))) {
        isParameterizedType = true;
    }

    if (!fmxTypeMap.has(typeName)) {
        if (isPrimitiveType) {
            fmxType = new Famix.PrimitiveType(famixRep);
            fmxType.setIsStub(true);
        }
        else if (isParameterizedType) {
            fmxType = new Famix.ParameterizedType(famixRep);
            const parameterTypeNames = typeName.substring(typeName.indexOf("<") + 1, typeName.indexOf(">")).split(",").map(s => s.trim());
            const baseTypeName = typeName.substring(0, typeName.indexOf("<")).trim();
            parameterTypeNames.forEach(parameterTypeName => {
                const fmxParameterType = createOrGetFamixType(parameterTypeName, element);
                (fmxType as Famix.ParameterizedType).addArgument(fmxParameterType);
            });
            const fmxBaseType = createOrGetFamixType(baseTypeName, element);
            (fmxType as Famix.ParameterizedType).setBaseType(fmxBaseType);
        }
        else {
            fmxType = new Famix.Type(famixRep);
        }

        fmxType.setName(typeName);
        fmxType.setContainer(ancestor);
        
        makeFamixIndexFileAnchor(element, fmxType);

        fmxTypeMap.set(typeName, fmxType);
    }
    else {
        fmxType = fmxTypeMap.get(typeName);
    }

    return fmxType;
}

/**
 * Creates a Famix access
 * @param node A node
 * @param id An id of a parameter, a variable, a property or an enum member
 */
export function createFamixAccess(node: Identifier, id: number): void {
    const fmxVar = famixRep.getFamixEntityById(id) as Famix.StructuralEntity;
    const nodeReferenceAncestor = Helpers.findAncestor(node);
    const ancestorFullyQualifiedName = FQNFunctions.getFQN(nodeReferenceAncestor);
    const accessor = famixRep.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;

    const fmxAccess = new Famix.Access(famixRep);
    fmxAccess.setAccessor(accessor);
    fmxAccess.setVariable(fmxVar);

    makeFamixIndexFileAnchor(node, fmxAccess);
}

/**
 * Creates a Famix invocation
 * @param node A node
 * @param m A method or a function
 * @param id The id of the method or the function
 */
export function createFamixInvocation(node: Identifier, m: MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, id: number): void {
    const fmxMethodOrFunction = famixRep.getFamixEntityById(id) as Famix.BehavioralEntity;
    const nodeReferenceAncestor = Helpers.findAncestor(node);
    const ancestorFullyQualifiedName = FQNFunctions.getFQN(nodeReferenceAncestor);
    const sender = famixRep.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
    const receiverFullyQualifiedName = FQNFunctions.getFQN(m.getParent());
    const receiver = famixRep.getFamixEntityByFullyQualifiedName(receiverFullyQualifiedName) as Famix.NamedEntity;

    const fmxInvocation = new Famix.Invocation(famixRep);
    fmxInvocation.setSender(sender);
    fmxInvocation.setReceiver(receiver);
    fmxInvocation.addCandidate(fmxMethodOrFunction);
    fmxInvocation.setSignature(fmxMethodOrFunction.getSignature());

    makeFamixIndexFileAnchor(node, fmxInvocation);
}

/**
 * Creates a Famix inheritance
 * @param cls A class or an interface (subclass)
 * @param inhClass The inherited class or interface (superclass)
 */
export function createFamixInheritance(cls: ClassDeclaration | InterfaceDeclaration, inhClass: ClassDeclaration | InterfaceDeclaration | ExpressionWithTypeArguments): void {
    const fmxInheritance = new Famix.Inheritance(famixRep);
    // const clsName = cls.getName();
    const classFullyQualifiedName = FQNFunctions.getFQN(cls);
    logger.debug(`createFamixInheritance: classFullyQualifiedName: class fqn = ${classFullyQualifiedName}`);
    let subClass: Famix.Class | Famix.Interface;
    if (cls instanceof ClassDeclaration) {
        subClass = fmxClassMap.get(classFullyQualifiedName);
    }
    else {
        subClass = fmxInterfaceMap.get(classFullyQualifiedName);
    }
    
    let inhClassName: string;
    let inhClassFullyQualifiedName: string;
    let superClass: Famix.Class | Famix.Interface;
    if (inhClass instanceof ClassDeclaration || inhClass instanceof InterfaceDeclaration) {
        inhClassName = inhClass.getName();
        inhClassFullyQualifiedName = FQNFunctions.getFQN(inhClass);
        if (inhClass instanceof ClassDeclaration) {
            superClass = fmxClassMap.get(inhClassFullyQualifiedName);
        }
        else {
            superClass = fmxInterfaceMap.get(inhClassFullyQualifiedName);
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
            superClass = new Famix.Class(famixRep);
            fmxClassMap.set(inhClassFullyQualifiedName, superClass);
        }
        else {
            superClass = new Famix.Interface(famixRep);
            fmxInterfaceMap.set(inhClassFullyQualifiedName, superClass);
        }

        superClass.setName(inhClassName);
        superClass.setFullyQualifiedName(inhClassFullyQualifiedName);
        superClass.setIsStub(true);

        makeFamixIndexFileAnchor(inhClass, superClass);
    }

    fmxInheritance.setSubclass(subClass);
    fmxInheritance.setSuperclass(superClass);

    makeFamixIndexFileAnchor(null, fmxInheritance);
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
export function createFamixImportClause(importClauseInfo: {importDeclaration?: ImportDeclaration, importer: SourceFile, moduleSpecifierFilePath: string, importElement: ImportSpecifier | Identifier, isInExports: boolean, isDefaultExport: boolean}): void {
    const {importDeclaration, importer, moduleSpecifierFilePath, importElement, isInExports, isDefaultExport} = importClauseInfo;
    logger.debug(`createFamixImportClause: Creating import clause:`);
    const fmxImportClause = new Famix.ImportClause(famixRep);

    let importedEntity: Famix.NamedEntity;
    let importedEntityName: string;

    const absolutePathProject = this.famixRep.getAbsolutePath();
    
    const path = require('path');

    const absolutePath = path.normalize(moduleSpecifierFilePath);

    let pathInProject: string = absolutePath.replace(absolutePathProject, "");

    pathInProject = pathInProject.slice(1)

    let pathName = "{" + pathInProject + "}.";
    if (importElement instanceof ImportSpecifier) {
        importedEntityName = importElement.getName();
        pathName = pathName + importedEntityName;
        if (isInExports) {
            importedEntity = famixRep.getFamixEntityByFullyQualifiedName(pathName) as Famix.NamedEntity;
        }
        if (importedEntity === undefined) {
            importedEntity = new Famix.NamedEntity(famixRep);
            importedEntity.setName(importedEntityName);
            if (!isInExports) {
                importedEntity.setIsStub(true);
            }
            makeFamixIndexFileAnchor(importElement, importedEntity);
            importedEntity.setFullyQualifiedName(pathName);
        }
    }
    else {
        importedEntityName = importElement.getText();
        if (isDefaultExport) {
            pathName = pathName + "defaultExport";
        }
        else {
            pathName = pathName + "namespaceExport";
        }
        importedEntity = new Famix.NamedEntity(famixRep);
        importedEntity.setName(importedEntityName);
        makeFamixIndexFileAnchor(importElement, importedEntity);
        importedEntity.setFullyQualifiedName(pathName);
    }

    const importerFullyQualifiedName = FQNFunctions.getFQN(importer);
    const fmxImporter = famixRep.getFamixEntityByFullyQualifiedName(importerFullyQualifiedName) as Famix.Module;
    fmxImportClause.setImportingEntity(fmxImporter);
    fmxImportClause.setImportedEntity(importedEntity);
    fmxImportClause.setModuleSpecifier(importDeclaration?.getModuleSpecifierValue() as string);

    logger.debug(`createFamixImportClause: ${fmxImportClause.getImportedEntity()?.getName()} (of type ${
        Helpers.getSubTypeName(fmxImportClause.getImportedEntity())}) is imported by ${fmxImportClause.getImportingEntity()?.getName()}`);

    // make an index file anchor for the import clause
    makeFamixIndexFileAnchor(importDeclaration, fmxImportClause);

    fmxImporter.addOutgoingImport(fmxImportClause);
}