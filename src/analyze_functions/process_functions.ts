import { ClassDeclaration, MethodDeclaration, VariableStatement, FunctionDeclaration, VariableDeclaration, InterfaceDeclaration, ParameterDeclaration, ConstructorDeclaration, MethodSignature, SourceFile, ModuleDeclaration, PropertyDeclaration, PropertySignature, Decorator, GetAccessorDeclaration, SetAccessorDeclaration, ExportedDeclarations, CommentRange, EnumDeclaration, EnumMember, TypeParameterDeclaration, TypeAliasDeclaration, SyntaxKind, FunctionExpression, Block, Identifier, ExpressionWithTypeArguments, ImportDeclaration, Node } from "ts-morph";
import * as Famix from "../lib/famix/src/model/famix";
import { calculate } from "../lib/ts-complex/cyclomatic-service";
import * as fs from 'fs';
import { logger , entityDictionary } from "../analyze";

export const methodsAndFunctionsWithId = new Map<number, MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression>(); // Maps the Famix method, constructor, getter, setter and function ids to their ts-morph method, constructor, getter, setter or function object
export const accessMap = new Map<number, ParameterDeclaration | VariableDeclaration | PropertyDeclaration | EnumMember>(); // Maps the Famix parameter, variable, property and enum value ids to their ts-morph parameter, variable, property or enum member object
export const classes = new Array<ClassDeclaration>(); // Array of all the classes of the source files
export const interfaces = new Array<InterfaceDeclaration>(); // Array of all the interfaces of the source files
export const modules = new Array<SourceFile>(); // Array of all the source files which are modules
export const exportedMap = new Array<ReadonlyMap<string, ExportedDeclarations[]>>(); // Array of all the exports
export let currentCC: unknown; // Stores the cyclomatic complexity metrics for the current source file

/**
 * Checks if the file has any imports or exports to be considered a module
 * @param sourceFile A source file
 * @returns A boolean indicating if the file is a module
 */
function ismodule(sourceFile: SourceFile): boolean {
    return sourceFile.getImportDeclarations().length > 0 || sourceFile.getExportedDeclarations().size > 0;
}

/**
 * Gets the path of a module to be imported
 * @param i An import declaration
 * @returns The path of the module to be imported
 */
export function getModulePath(i: ImportDeclaration): string {
    let path: string;
    if (i.getModuleSpecifierSourceFile() === undefined) {
        if (i.getModuleSpecifierValue().substring(i.getModuleSpecifierValue().length - 3) === ".ts") {
            path = i.getModuleSpecifierValue();
        }
        else {
            path = i.getModuleSpecifierValue() + ".ts";
        }
    }
    else {
        path = i.getModuleSpecifierSourceFile().getFilePath();
    }
    return path;
}

/**
 * Gets the interfaces implemented or extended by a class or an interface
 * @param interfaces An array of interfaces
 * @param subClass A class or an interface
 * @returns An array of InterfaceDeclaration and ExpressionWithTypeArguments containing the interfaces implemented or extended by the subClass
 */
export function getImplementedOrExtendedInterfaces(interfaces: Array<InterfaceDeclaration>, subClass: ClassDeclaration | InterfaceDeclaration): Array<InterfaceDeclaration | ExpressionWithTypeArguments> {
    let impOrExtInterfaces: Array<ExpressionWithTypeArguments>;
    if (subClass instanceof ClassDeclaration) {
        impOrExtInterfaces = subClass.getImplements();
    }
    else {
        impOrExtInterfaces = subClass.getExtends();
    }

    const interfacesNames = interfaces.map(i => i.getName());
    const implementedOrExtendedInterfaces = new Array<InterfaceDeclaration | ExpressionWithTypeArguments>();

    impOrExtInterfaces.forEach(i => {
        if (interfacesNames.includes(i.getExpression().getText())) {
            implementedOrExtendedInterfaces.push(interfaces[interfacesNames.indexOf(i.getExpression().getText())]);
        }
        else {
            implementedOrExtendedInterfaces.push(i);
        }
    });

    return implementedOrExtendedInterfaces;
}

/**
 * Builds a Famix model for an array of source files
 * @param sourceFiles An array of source files
 */
export function processFiles(sourceFiles: Array<SourceFile>): void {
    sourceFiles.forEach(file => {
        logger.info(`File: >>>>>>>>>> ${file.getFilePath()}`);

        // Computes the cyclomatic complexity metrics for the current source file if it exists (i.e. if it is not from a jest test)
        if (fs.existsSync(file.getFilePath()))
            currentCC = calculate(file.getFilePath());
        else
            currentCC = 0;

        processFile(file);
    });
}

/**
 * Builds a Famix model for a source file
 * @param f A source file
 */
function processFile(f: SourceFile): void {
    const isModule = ismodule(f);

    if (isModule) {
        modules.push(f);
        exportedMap.push(f.getExportedDeclarations());
    }

    const fmxFile = entityDictionary.createOrGetFamixFile(f, isModule);

    logger.debug(`processFile: file: ${f.getBaseName()}, fqn = ${fmxFile.getFullyQualifiedName()}`);

    processComments(f, fmxFile);

    processAliases(f, fmxFile);

    processClasses(f, fmxFile);

    processInterfaces(f, fmxFile);

    processVariables(f, fmxFile);

    processEnums(f, fmxFile);

    processFunctions(f, fmxFile);

    processNamespaces(f, fmxFile);
}

/**
 * Builds a Famix model for a namespace
 * @param m A namespace
 * @returns A Famix.Namespace representing the namespace
 */
function processNamespace(m: ModuleDeclaration): Famix.Namespace {
    const fmxNamespace = entityDictionary.createOrGetFamixNamespace(m);

    logger.debug(`processNamespace: namespace: ${m.getName()}, (${m.getType().getText()}), ${fmxNamespace.getFullyQualifiedName()}`);

    processComments(m, fmxNamespace);

    processAliases(m, fmxNamespace);

    processClasses(m, fmxNamespace);

    processInterfaces(m, fmxNamespace);

    processVariables(m, fmxNamespace);

    processEnums(m, fmxNamespace);
    
    processFunctions(m, fmxNamespace);

    processNamespaces(m, fmxNamespace);

    return fmxNamespace;
}

/**
 * Builds a Famix model for the aliases of a container
 * @param m A container (a source file, a namespace, a function or a method)
 * @param fmxScope The Famix model of the container
 */
function processAliases(m: SourceFile | ModuleDeclaration | FunctionDeclaration | FunctionExpression | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace | Famix.Function | Famix.Method | Famix.Accessor): void {
    logger.debug(`processAliases: ---------- Finding Aliases:`);
    m.getTypeAliases().forEach(a => {
        const fmxAlias = processAlias(a);
        fmxScope.addAlias(fmxAlias);
    });
}

/**
 * Builds a Famix model for the classes of a container
 * @param m A container (a source file or a namespace)
 * @param fmxScope The Famix model of the container
 */
function processClasses(m: SourceFile | ModuleDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace): void {
    logger.debug(`processClasses: ---------- Finding Classes:`);
    m.getClasses().forEach(c => {
        const fmxClass = processClass(c);
        fmxScope.addType(fmxClass);
    });
}

/**
 * Builds a Famix model for the interfaces of a container
 * @param m A container (a source file or a namespace)
 * @param fmxScope The Famix model of the container
 */
function processInterfaces(m: SourceFile | ModuleDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace): void {
    logger.debug(`processInterfaces: ---------- Finding Interfaces:`);
    m.getInterfaces().forEach(i => {
        const fmxInterface = processInterface(i);
        fmxScope.addType(fmxInterface);
    });
}

/**
 * Builds a Famix model for the variables of a container
 * @param m A container (a source file, a namespace, a function or a method)
 * @param fmxScope The Famix model of the container
 */
function processVariables(m: SourceFile | ModuleDeclaration | FunctionDeclaration | FunctionExpression | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace | Famix.Function | Famix.Method | Famix.Accessor): void {
    logger.debug(`processVariables: ---------- Finding Variables:`);
    m.getVariableStatements().forEach(v => {
        const fmxVariables = processVariableStatement(v);
        fmxVariables.forEach(fmxVariable => {
            fmxScope.addVariable(fmxVariable);
        });
    });
}

/**
 * Builds a Famix model for the enums of a container
 * @param m A container (a source file, a namespace, a function or a method)
 * @param fmxScope The Famix model of the container
 */
function processEnums(m: SourceFile | ModuleDeclaration | FunctionDeclaration | FunctionExpression | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace | Famix.Function | Famix.Method | Famix.Accessor): void {
    logger.debug(`processEnums: ---------- Finding Enums:`);
    m.getEnums().forEach(e => {
        const fmxEnum = processEnum(e);
        fmxScope.addType(fmxEnum);
    });
}

/**
 * Builds a Famix model for the functions of a container
 * @param m A container (a source file, a namespace, a function or a method)
 * @param fmxScope The Famix model of the container
 */
function processFunctions(m: SourceFile | ModuleDeclaration | FunctionDeclaration | FunctionExpression | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace | Famix.Function | Famix.Method | Famix.Accessor): void {
    logger.debug(`Finding Functions:`);
    m.getFunctions().forEach(f => {
        const fmxFunction = processFunction(f);
        fmxScope.addFunction(fmxFunction);
    });
}

/**
 * Builds a Famix model for the namespaces of a container
 * @param m A container (a source file or a namespace)
 * @param fmxScope The Famix model of the container
 */
function processNamespaces(m: SourceFile | ModuleDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace): void {
    logger.debug(`Finding Namespaces:`);
    m.getModules().forEach(md => {
        const fmxNsp = processNamespace(md);
        fmxScope.addNamespace(fmxNsp);
    });
}

/**
 * Builds a Famix model for an alias
 * @param a An alias
 * @returns A Famix.Alias representing the alias
 */
function processAlias(a: TypeAliasDeclaration): Famix.Alias {
    const fmxAlias = entityDictionary.createFamixAlias(a);

    logger.debug(`Alias: ${a.getName()}, (${a.getType().getText()}), fqn = ${fmxAlias.getFullyQualifiedName()}`);

    processComments(a, fmxAlias);

    return fmxAlias;
}

/**
 * Builds a Famix model for a class
 * @param c A class
 * @returns A Famix.Class or a Famix.ParameterizableClass representing the class
 */
function processClass(c: ClassDeclaration): Famix.Class | Famix.ParameterizableClass {
    classes.push(c);

    const fmxClass = entityDictionary.createOrGetFamixClass(c);

    logger.debug(`Class: ${c.getName()}, (${c.getType().getText()}), fqn = ${fmxClass.getFullyQualifiedName()}`);

    processComments(c, fmxClass);

    processDecorators(c, fmxClass);

    processStructuredType(c, fmxClass);

    c.getConstructors().forEach(con => {
        const fmxCon = processMethod(con);
        fmxClass.addMethod(fmxCon);
    });

    c.getGetAccessors().forEach(acc => {
        const fmxAcc = processMethod(acc);
        fmxClass.addMethod(fmxAcc);
    });
    
    c.getSetAccessors().forEach(acc => {
        const fmxAcc = processMethod(acc);
        fmxClass.addMethod(fmxAcc);
    });

    return fmxClass;
}

/**
 * Builds a Famix model for an interface
 * @param i An interface
 * @returns A Famix.Interface or a Famix.ParameterizableInterface representing the interface
 */
function processInterface(i: InterfaceDeclaration): Famix.Interface | Famix.ParameterizableInterface {
    interfaces.push(i);

    const fmxInterface = entityDictionary.createOrGetFamixInterface(i);

    logger.debug(`Interface: ${i.getName()}, (${i.getType().getText()}), fqn = ${fmxInterface.getFullyQualifiedName()}`);

    processComments(i, fmxInterface);

    processStructuredType(i, fmxInterface);

    return fmxInterface;
}

/**
 * Builds a Famix model for the type parameters, properties and methods of a structured type
 * @param c A structured type (a class or an interface)
 * @param fmxScope The Famix model of the structured type
 */
function processStructuredType(c: ClassDeclaration | InterfaceDeclaration, fmxScope: Famix.Class | Famix.ParameterizableClass | Famix.Interface | Famix.ParameterizableInterface): void {
    logger.debug(`Finding Properties and Methods:`);
    if (fmxScope instanceof Famix.ParameterizableClass || fmxScope instanceof Famix.ParameterizableInterface) {
        processTypeParameters(c, fmxScope);
    }

    c.getProperties().forEach(prop => {
        const fmxProperty = processProperty(prop);
        fmxScope.addProperty(fmxProperty);
    });

    c.getMethods().forEach(m => {
        const fmxMethod = processMethod(m);
        fmxScope.addMethod(fmxMethod);
    });
}

/**
 * Builds a Famix model for a property
 * @param p A property
 * @returns A Famix.Property representing the property
 */
function processProperty(p: PropertyDeclaration | PropertySignature): Famix.Property {
    const fmxProperty = entityDictionary.createFamixProperty(p);

    logger.debug(`property: ${p.getName()}, (${p.getType().getText()}), fqn = ${fmxProperty.getFullyQualifiedName()}`);
    logger.debug(` ---> It's a Property${(p instanceof PropertySignature) ? "Signature" : "Declaration"}!`);
    const ancestor = p.getFirstAncestorOrThrow();
    logger.debug(` ---> Its first ancestor is a ${ancestor.getKindName()}`);

    if (!(p instanceof PropertySignature)) {
        processDecorators(p, fmxProperty);
        // only add access if the p's first ancestor is not a PropertyDeclaration
        if (ancestor.getKindName() !== "PropertyDeclaration") {
            logger.debug(`adding access: ${p.getName()}, (${p.getType().getText()}) Famix ${fmxProperty.getName()}`);
            accessMap.set(fmxProperty.id, p);
        }
    }

    processComments(p, fmxProperty);

    return fmxProperty;
}

/**
     * Builds a Famix model for a method or an accessor
     * @param m A method or an accessor
     * @returns A Famix.Method or a Famix.Accessor representing the method or the accessor
     */
function processMethod(m: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration): Famix.Method | Famix.Accessor {
    const fmxMethod = entityDictionary.createFamixMethod(m, currentCC);

    logger.debug(`Method: ${!(m instanceof ConstructorDeclaration) ? m.getName() : "constructor"}, (${m.getType().getText()}), parent: ${(m.getParent() as ClassDeclaration | InterfaceDeclaration).getName()}, fqn = ${fmxMethod.getFullyQualifiedName()}`);

    processComments(m, fmxMethod);

    processTypeParameters(m, fmxMethod);

    processParameters(m, fmxMethod);

    if (!(m instanceof MethodSignature)) {
        processAliases(m, fmxMethod);

        processVariables(m, fmxMethod);

        processEnums(m, fmxMethod);

        processFunctions(m, fmxMethod);

        processFunctionExpressions(m, fmxMethod);

        methodsAndFunctionsWithId.set(fmxMethod.id, m);
    }

    if (m instanceof MethodDeclaration || m instanceof GetAccessorDeclaration || m instanceof SetAccessorDeclaration) {
        processDecorators(m, fmxMethod);
    }

    return fmxMethod;
}

/**
 * Builds a Famix model for a function
 * @param f A function
 * @returns A Famix.Function representing the function
 */
function processFunction(f: FunctionDeclaration | FunctionExpression): Famix.Function {
    const fmxFunction = entityDictionary.createFamixFunction(f, currentCC);

    logger.debug(`Function: ${(f.getName()) ? f.getName() : "anonymous"}, (${f.getType().getText()}), fqn = ${fmxFunction.getFullyQualifiedName()}`);

    processComments(f, fmxFunction);

    processAliases(f, fmxFunction);

    processTypeParameters(f, fmxFunction);

    processParameters(f, fmxFunction);

    processVariables(f, fmxFunction);

    processEnums(f, fmxFunction);

    processFunctions(f, fmxFunction);

    if (f instanceof FunctionDeclaration && !(f.getParent() instanceof Block)) {
        processFunctionExpressions(f, fmxFunction);
    }

    methodsAndFunctionsWithId.set(fmxFunction.id, f);

    return fmxFunction;
}

/**
 * Builds a Famix model for the function expressions of a function or a method
 * @param f A function or a method
 * @param fmxScope The Famix model of the function or the method
 */
function processFunctionExpressions(f: FunctionDeclaration | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.Function | Famix.Method | Famix.Accessor): void {
    logger.debug(`Finding Function Expressions:`);
    const functionExpressions = f.getDescendantsOfKind(SyntaxKind.FunctionExpression);
    functionExpressions.forEach((func) => {
        const fmxFunc = processFunction(func);
        fmxScope.addFunction(fmxFunc);
    });
}

/**
 * Builds a Famix model for the parameters of a method or a function
 * @param m A method or a function
 * @param fmxScope The Famix model of the method or the function
 */
function processParameters(m: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, fmxScope: Famix.Method | Famix.Accessor | Famix.Function): void {
    logger.debug(`Finding Parameters:`);
    m.getParameters().forEach(param => {
        const fmxParam = processParameter(param);
        fmxScope.addParameter(fmxParam);
    });
}

/**
 * Builds a Famix model for a parameter
 * @param p A parameter
 * @returns A Famix.Parameter representing the parameter
 */
function processParameter(p: ParameterDeclaration): Famix.Parameter {
    const fmxParam = entityDictionary.createFamixParameter(p);

    logger.debug(`parameter: ${p.getName()}, (${p.getType().getText()}), fqn = ${fmxParam.getFullyQualifiedName()}`);

    processComments(p, fmxParam);

    processDecorators(p, fmxParam);

    const parent = p.getParent();

    if (!(parent instanceof MethodSignature)) {
        logger.debug(`adding access: ${p.getName()}, (${p.getType().getText()}) Famix ${fmxParam.getName()}`);
        accessMap.set(fmxParam.id, p);
    }

    return fmxParam;
}

/**
 * Builds a Famix model for the type parameters of a class, an interface, a method or a function
 * @param e A class, an interface, a method or a function
 * @param fmxScope The Famix model of the class, the interface, the method or the function
 */
function processTypeParameters(e: ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, fmxScope: Famix.ParameterizableClass | Famix.ParameterizableInterface | Famix.Method | Famix.Accessor | Famix.Function): void {
    logger.debug(`Finding Type Parameters:`);
    e.getTypeParameters().forEach(tp => {
        const fmxParam = processTypeParameter(tp);
        fmxScope.addParameterType(fmxParam);
    });
}

/**
 * Builds a Famix model for a type parameter
 * @param tp A type parameter
 * @returns A Famix.TypeParameter representing the type parameter
 */
function processTypeParameter(tp: TypeParameterDeclaration): Famix.ParameterType {
    const fmxTypeParameter = entityDictionary.createFamixParameterType(tp);

    logger.debug(`type parameter: ${tp.getName()}, (${tp.getType().getText()}), fqn = ${fmxTypeParameter.getFullyQualifiedName()}`);

    processComments(tp, fmxTypeParameter);

    return fmxTypeParameter;
}

/**
 * Builds a Famix model for the variables of a variable statement
 * @param v A variable statement
 * @returns An array of Famix.Variable representing the variables
 */
function processVariableStatement(v: VariableStatement): Array<Famix.Variable> {
    const fmxVariables = new Array<Famix.Variable>();

    logger.debug(`Variable statement: ${v.getText()}, (${v.getType().getText()}), ${v.getDeclarationKindKeywords()[0]}, fqn = ${v.getDeclarations()[0].getName()}`);

    v.getDeclarations().forEach(variable => {
        const fmxVar = processVariable(variable);
        processComments(v, fmxVar);
        fmxVariables.push(fmxVar);
    }); 

    return fmxVariables;
}

/**
 * Builds a Famix model for a variable
 * @param v A variable
 * @returns A Famix.Variable representing the variable
 */
function processVariable(v: VariableDeclaration): Famix.Variable {
    const fmxVar = entityDictionary.createFamixVariable(v);

    logger.debug(`variable: ${v.getName()}, (${v.getType().getText()}), ${v.getInitializer() ? "initializer: " + v.getInitializer().getText() : "initializer: "}, fqn = ${fmxVar.getFullyQualifiedName()}`);

    processComments(v, fmxVar);

    logger.debug(`adding access: ${v.getName()}, (${v.getType().getText()}) Famix ${fmxVar.getName()}`);
    accessMap.set(fmxVar.id, v);

    return fmxVar;
}

/**
 * Builds a Famix model for an enum
 * @param e An enum
 * @returns A Famix.Enum representing the enum
 */
function processEnum(e: EnumDeclaration): Famix.Enum {
    const fmxEnum = entityDictionary.createFamixEnum(e);

    logger.debug(`enum: ${e.getName()}, (${e.getType().getText()}), fqn = ${fmxEnum.getFullyQualifiedName()}`);

    processComments(e, fmxEnum);

    e.getMembers().forEach(m => {
        const fmxEnumValue = processEnumValue(m);
        fmxEnum.addValue(fmxEnumValue);
    });

    return fmxEnum;
}

/**
 * Builds a Famix model for an enum member
 * @param v An enum member
 * @returns A Famix.EnumValue representing the enum member
 */
function processEnumValue(v: EnumMember): Famix.EnumValue {
    const fmxEnumValue = entityDictionary.createFamixEnumValue(v);

    logger.debug(`enum value: ${v.getName()}, (${v.getType().getText()}), fqn = ${fmxEnumValue.getFullyQualifiedName()}`);

    processComments(v, fmxEnumValue);

    logger.debug(`adding access: ${v.getName()}, (${v.getType().getText()}) Famix ${fmxEnumValue.getName()}`);
    accessMap.set(fmxEnumValue.id, v);

    return fmxEnumValue;
}

/**
 * Builds a Famix model for the decorators of a class, a method, a parameter or a property
 * @param e A class, a method, a parameter or a property
 * @param fmxScope The Famix model of the class, the method, the parameter or the property
 */
function processDecorators(e: ClassDeclaration | MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ParameterDeclaration | PropertyDeclaration, fmxScope: Famix.Class | Famix.ParameterizableClass | Famix.Method | Famix.Accessor | Famix.Parameter | Famix.Property): void {
    logger.debug(`Finding Decorators:`);
    e.getDecorators().forEach(dec => {
        const fmxDec = processDecorator(dec, e);
        fmxScope.addDecorator(fmxDec);
    });
}

/**
 * Builds a Famix model for a decorator
 * @param d A decorator
 * @param e A class, a method, a parameter or a property
 * @returns A Famix.Decorator representing the decorator
 */
function processDecorator(d: Decorator, e: ClassDeclaration | MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ParameterDeclaration | PropertyDeclaration): Famix.Decorator {
    const fmxDec = entityDictionary.createOrGetFamixDecorator(d, e);

    logger.debug(`decorator: ${d.getName()}, (${d.getType().getText()}), fqn = ${fmxDec.getFullyQualifiedName()}`);

    processComments(d, fmxDec);

    return fmxDec;
}

/**
 * Builds a Famix model for the comments
 * @param e A ts-morph element
 * @param fmxScope The Famix model of the named entity
 */
function processComments(e: SourceFile | ModuleDeclaration | ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | PropertyDeclaration | PropertySignature | Decorator | EnumDeclaration | EnumMember | TypeParameterDeclaration | VariableStatement | TypeAliasDeclaration, fmxScope: Famix.NamedEntity): void {
    logger.debug(`Process comments:`);
    e.getLeadingCommentRanges().forEach(c => {
        const fmxComment = processComment(c, fmxScope);
        logger.debug(`leading comments, addComment: '${c.getText()}'`);
        fmxScope.addComment(fmxComment); // redundant, but just in case
    });
    e.getTrailingCommentRanges().forEach(c => {
        const fmxComment = processComment(c, fmxScope);
        logger.debug(`trailing comments, addComment: '${c.getText()}'`);
        fmxScope.addComment(fmxComment);
    });
}

/**
 * Builds a Famix model for a comment
 * @param c A comment
 * @param fmxScope The Famix model of the comment's container
 * @returns A Famix.Comment representing the comment
 */
function processComment(c: CommentRange, fmxScope: Famix.NamedEntity): Famix.Comment {
    const isJSDoc = c.getText().startsWith("/**");
    logger.debug(`processComment: comment: ${c.getText()}, isJSDoc = ${isJSDoc}`);
    const fmxComment = entityDictionary.createFamixComment(c, fmxScope, isJSDoc);

    return fmxComment;
}

/**
 * Builds a Famix model for the accesses on the parameters, variables, properties and enum members of the source files
 * @param accessMap A map of parameters, variables, properties and enum members with their id
 */
export function processAccesses(accessMap: Map<number, ParameterDeclaration | VariableDeclaration | PropertyDeclaration | EnumMember>): void {
    logger.debug(`processAccesses: Creating accesses:`);
    accessMap.forEach((v, id) => {
        logger.debug(`processAccesses: Accesses to ${v.getName()}`);
        try {
            const temp_nodes = v.findReferencesAsNodes() as Array<Identifier>;
            temp_nodes.forEach(node => processNodeForAccesses(node, id));
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Continuing...`);
        }
    });
}

/**
 * Builds a Famix model for an access on a parameter, variable, property or enum member
 * @param n A node
 * @param id An id of a parameter, a variable, a property or an enum member
 */
function processNodeForAccesses(n: Identifier, id: number): void {
    try {
        // sometimes node's first ancestor is a PropertyDeclaration, which is not an access
        // see https://github.com/fuhrmanator/FamixTypeScriptImporter/issues/9
        // check for a node whose first ancestor is a property declaration and bail?
        // This may be a bug in ts-morph?
        if (n.getFirstAncestorOrThrow().getKindName() === "PropertyDeclaration") {
            logger.debug(`processNodeForAccesses: node kind: ${n.getKindName()}, ${n.getText()}, (${n.getType().getText()})'s first ancestor is a PropertyDeclaration. Skipping...`);
            return;
        }
        entityDictionary.createFamixAccess(n, id);
        logger.debug(`processNodeForAccesses: node kind: ${n.getKindName()}, ${n.getText()}, (${n.getType().getText()})`);
    } catch (error) {
        logger.error(`> WARNING: got exception ${error}. ScopeDeclaration invalid for ${n.getSymbol().getFullyQualifiedName()}. Continuing...`);
    }
}

export function processImportClausesForImportEqualsDeclarations(sourceFiles: Array<SourceFile>, exports: Array<ReadonlyMap<string, ExportedDeclarations[]>>): void {
    logger.info(`Creating import clauses from ImportEqualsDeclarations in source files:`);
    sourceFiles.forEach(sourceFile => {
        sourceFile.forEachDescendant(node => {
            if (Node.isImportEqualsDeclaration(node)) {
                // You've found an ImportEqualsDeclaration
                logger.info("Declaration Name:", node.getName());
                logger.info("Module Reference Text:", node.getModuleReference().getText());
                // create a famix import clause
                const namedImport = node.getNameNode();
                entityDictionary.createFamixImportClause({importDeclaration: node,
                    importer: sourceFile, 
                    moduleSpecifierFilePath: node.getModuleReference().getText(), 
                    importElement: namedImport, 
                    isInExports: exports.find(e => e.has(namedImport.getText())) !== undefined, 
                    isDefaultExport: false});
            }
        });
    }
    );

}

/**
     * Builds a Famix model for the import clauses of the source files which are modules
     * @param modules An array of modules
     * @param exports An array of maps of exported declarations
     */
export function processImportClausesForModules(modules: Array<SourceFile>, exports: Array<ReadonlyMap<string, ExportedDeclarations[]>>): void {
    logger.info(`Creating import clauses from ${modules.length} modules:`);
    modules.forEach(module => {
        module.getImportDeclarations().forEach(impDecl => {
            logger.debug(`Importing ${impDecl.getModuleSpecifierValue()}`);
            const path = getModulePath(impDecl);

            impDecl.getNamedImports().forEach(namedImport => {
                logger.debug(`Importing (named) ${namedImport.getName()} from ${impDecl.getModuleSpecifierValue()}`);
                const importedEntityName = namedImport.getName();
                let importFoundInExports = false;
                exports.forEach(e => {
                    if (e.has(importedEntityName)) {
                        importFoundInExports = true;
                    }
                });
                entityDictionary.createFamixImportClause({importDeclaration: impDecl,
                    importer: module, 
                    moduleSpecifierFilePath: path, 
                    importElement: namedImport, 
                    isInExports: importFoundInExports, 
                    isDefaultExport: false});
            });

            const defaultImport = impDecl.getDefaultImport();
            if (defaultImport !== undefined) {
                logger.debug(`Importing (default) ${defaultImport.getText()} from ${impDecl.getModuleSpecifierValue()}`);
                // call with module, impDecl.getModuleSpecifierValue(), path, defaultImport, false, true
                entityDictionary.createFamixImportClause({importDeclaration: impDecl,
                    importer: module,
                    moduleSpecifierFilePath: path,
                    importElement: defaultImport,
                    isInExports: false,
                    isDefaultExport: true});
            }

            const namespaceImport = impDecl.getNamespaceImport();
            if (namespaceImport !== undefined) {
                logger.debug(`Importing (namespace) ${namespaceImport.getText()} from ${impDecl.getModuleSpecifierValue()}`);
                entityDictionary.createFamixImportClause({importDeclaration: impDecl,
                    importer: module, 
                    moduleSpecifierFilePath: path, 
                    importElement: namespaceImport, 
                    isInExports: false, 
                    isDefaultExport: false});
                // entityDictionary.createFamixImportClause(module, impDecl.getModuleSpecifierValue(), path, namespaceImport, false, false);
            }
        }); 
    });
}

/**
     * Builds a Famix model for the inheritances of the classes and interfaces of the source files
     * @param classes An array of classes
     * @param interfaces An array of interfaces
     */
export function processInheritances(classes: ClassDeclaration[], interfaces: InterfaceDeclaration[]): void {
    logger.info(`processInheritances: Creating inheritances:`);
    classes.forEach(cls => {
        logger.debug(`processInheritances: Checking class inheritance for ${cls.getName()}`);
        const extClass = cls.getBaseClass();
        if (extClass !== undefined) {
            entityDictionary.createFamixInheritance(cls, extClass);
            
            logger.debug(`processInheritances: class: ${cls.getName()}, (${cls.getType().getText()}), extClass: ${extClass.getName()}, (${extClass.getType().getText()})`);
        }

        logger.debug(`processInheritances: Checking interface inheritance for ${cls.getName()}`);
        const implementedInterfaces = getImplementedOrExtendedInterfaces(interfaces, cls);
        implementedInterfaces.forEach(impInter => {
            entityDictionary.createFamixInheritance(cls, impInter);

            logger.debug(`processInheritances: class: ${cls.getName()}, (${cls.getType().getText()}), impInter: ${(impInter instanceof InterfaceDeclaration) ? impInter.getName() : impInter.getExpression().getText()}, (${(impInter instanceof InterfaceDeclaration) ? impInter.getType().getText() : impInter.getExpression().getText()})`);
        });
    });

    interfaces.forEach(inter => {
        logger.debug(`processInheritances: Checking interface inheritance for ${inter.getName()}`);
        const extendedInterfaces = getImplementedOrExtendedInterfaces(interfaces, inter);
        extendedInterfaces.forEach(extInter => {
            entityDictionary.createFamixInheritance(inter, extInter);

            logger.debug(`processInheritances: inter: ${inter.getName()}, (${inter.getType().getText()}), extInter: ${(extInter instanceof InterfaceDeclaration) ? extInter.getName() : extInter.getExpression().getText()}, (${(extInter instanceof InterfaceDeclaration) ? extInter.getType().getText() : extInter.getExpression().getText()})`);
        });
    });
}

/**
 * Builds a Famix model for the invocations of the methods and functions of the source files
 * @param methodsAndFunctionsWithId A map of methods and functions with their id
 */
export function processInvocations(methodsAndFunctionsWithId: Map<number, MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression>): void {
    logger.info(`Creating invocations:`);
    methodsAndFunctionsWithId.forEach((m, id) => {
        logger.debug(`Invocations to ${(m instanceof MethodDeclaration || m instanceof GetAccessorDeclaration || m instanceof SetAccessorDeclaration || m instanceof FunctionDeclaration) ? m.getName() : ((m instanceof ConstructorDeclaration) ? 'constructor' : (m.getName() ? m.getName() : 'anonymous'))}`);
        try {
            const temp_nodes = m.findReferencesAsNodes() as Array<Identifier>;
            temp_nodes.forEach(node => processNodeForInvocations(node, m, id));
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. Continuing...`);
        }
    });
}

/**
 * Builds a Famix model for an invocation of a method or a function
 * @param n A node
 * @param m A method or a function
 * @param id The id of the method or the function
 */
function processNodeForInvocations(n: Identifier, m: MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, id: number): void {
    try {
        entityDictionary.createFamixInvocation(n, m, id);

        logger.debug(`node: node, (${n.getType().getText()})`);
    } catch (error) {
        logger.error(`> WARNING: got exception ${error}. ScopeDeclaration invalid for ${n.getSymbol().getFullyQualifiedName()}. Continuing...`);
    }
}