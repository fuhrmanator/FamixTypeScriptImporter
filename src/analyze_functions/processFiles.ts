import { ClassDeclaration, MethodDeclaration, VariableStatement, FunctionDeclaration, VariableDeclaration, InterfaceDeclaration, ParameterDeclaration, ConstructorDeclaration, MethodSignature, SourceFile, ModuleDeclaration, PropertyDeclaration, PropertySignature, Decorator, GetAccessorDeclaration, SetAccessorDeclaration, ExportedDeclarations, CommentRange, EnumDeclaration, EnumMember, TypeParameterDeclaration, TypeAliasDeclaration, SyntaxKind, FunctionExpression, Block } from "ts-morph";
import * as Famix from "../lib/famix/src/model/famix";
import { FamixFunctions } from "../famix_functions/famix_functions";
import { calculate } from "../lib/ts-complex/cyclomatic-service";
import * as fs from 'fs';
import { logger } from "../analyze";

/**
 * This class is used to build a Famix model for an array of source files
 */
export class ProcessFiles {

    private famixFunctions: FamixFunctions; // FamixFunctions object, it contains all the functions needed to create Famix entities
    private methodsAndFunctionsWithId = new Map<number, MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression>(); // Maps the Famix method, constructor, getter, setter and function ids to their ts-morph method, constructor, getter, setter or function object
    private accessMap = new Map<number, ParameterDeclaration | VariableDeclaration | PropertyDeclaration | EnumMember>(); // Maps the Famix parameter, variable, property and enum value ids to their ts-morph parameter, variable, property or enum member object
    private classes = new Array<ClassDeclaration>(); // Array of all the classes of the source files
    private interfaces = new Array<InterfaceDeclaration>(); // Array of all the interfaces of the source files
    private modules = new Array<SourceFile>(); // Array of all the source files which are modules
    private exports = new Array<ReadonlyMap<string, ExportedDeclarations[]>>(); // Array of all the exports
    private currentCC: unknown; // Stores the cyclomatic complexity metrics for the current source file

    /**
     * Initializes the ProcessFiles object
     * @param famixFunctions FamixFunctions object, it contains all the functions needed to create Famix entities
     */
    constructor(famixFunctions: FamixFunctions) {
        this.famixFunctions = famixFunctions;
    }

    /**
     * Builds a Famix model for an array of source files
     * @param sourceFiles An array of source files
     */
    public processFiles(sourceFiles: Array<SourceFile>): void {
        sourceFiles.forEach(file => {
            logger.info(`File: >>>>>>>>>> ${file.getFilePath()}`);

            // Computes the cyclomatic complexity metrics for the current source file if it exists (i.e. if it is not from a jest test)
            if (fs.existsSync(file.getFilePath()))
                this.currentCC = calculate(file.getFilePath());
            else
                this.currentCC = 0;

            this.processFile(file);
        });
    }

    /**
     * Gets the map of methods and functions with their id
     * @returns The map of methods and functions with their id
     */
    public getMethodsAndFunctionsWithId(): Map<number, MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression> {
        return this.methodsAndFunctionsWithId;
    }
    
    /**
     * Gets the map of accesses
     * @returns The map of accesses
     */
    public getAccesses(): Map<number, ParameterDeclaration | VariableDeclaration | PropertyDeclaration | EnumMember> {
        return this.accessMap;
    }

    /**
     * Gets the array of classes
     * @returns The array of classes
     */
    public getClasses(): Array<ClassDeclaration> {
        return this.classes;
    }

    /**
     * Gets the array of interfaces
     * @returns The array of interfaces
     */
    public getInterfaces(): Array<InterfaceDeclaration> {
        return this.interfaces;
    }

    /**
     * Gets the array of modules
     * @returns The array of modules
     */
    public getModules(): Array<SourceFile> {
        return this.modules;
    }

    /**
     * Gets the array of exports
     * @returns The array of exports
     */
    public getExports(): Array<ReadonlyMap<string, ExportedDeclarations[]>> {
        return this.exports;
    }

    /**
     * Builds a Famix model for a source file
     * @param f A source file
     */
    private processFile(f: SourceFile): void {
        const isModule = this.isModule(f);

        if (isModule) {
            this.modules.push(f);
        }

        const fmxFile = this.famixFunctions.createOrGetFamixFile(f, isModule);

        logger.debug(`processFile: file: ${f.getBaseName()}, fqn = ${fmxFile.getFullyQualifiedName()}`);

        this.processComments(f, fmxFile);

        this.processAliases(f, fmxFile);

        this.processClasses(f, fmxFile);

        this.processInterfaces(f, fmxFile);

        this.processVariables(f, fmxFile);

        this.processEnums(f, fmxFile);

        this.processFunctions(f, fmxFile);

        this.processNamespaces(f, fmxFile);
    }

    /**
     * Builds a Famix model for a namespace
     * @param m A namespace
     * @returns A Famix.Namespace representing the namespace
     */
    private processNamespace(m: ModuleDeclaration): Famix.Namespace {
        const fmxNamespace = this.famixFunctions.createOrGetFamixNamespace(m);

        logger.debug(`processNamespace: namespace: ${m.getName()}, (${m.getType().getText()}), ${fmxNamespace.getFullyQualifiedName()}`);

        this.processComments(m, fmxNamespace);

        this.processAliases(m, fmxNamespace);

        this.processClasses(m, fmxNamespace);

        this.processInterfaces(m, fmxNamespace);

        this.processVariables(m, fmxNamespace);

        this.processEnums(m, fmxNamespace);
        
        this.processFunctions(m, fmxNamespace);

        this.processNamespaces(m, fmxNamespace);

        return fmxNamespace;
    }

    /**
     * Builds a Famix model for the aliases of a container
     * @param m A container (a source file, a namespace, a function or a method)
     * @param fmxScope The Famix model of the container
     */
    private processAliases(m: SourceFile | ModuleDeclaration | FunctionDeclaration | FunctionExpression | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace | Famix.Function | Famix.Method | Famix.Accessor): void {
        logger.debug(`processAliases: ---------- Finding Aliases:`);
        m.getTypeAliases().forEach(a => {
            const fmxAlias = this.processAlias(a);
            fmxScope.addAlias(fmxAlias);
        });
    }

    /**
     * Builds a Famix model for the classes of a container
     * @param m A container (a source file or a namespace)
     * @param fmxScope The Famix model of the container
     */
    private processClasses(m: SourceFile | ModuleDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace): void {
        logger.debug(`processClasses: ---------- Finding Classes:`);
        m.getClasses().forEach(c => {
            const fmxClass = this.processClass(c);
            fmxScope.addType(fmxClass);
        });
    }

    /**
     * Builds a Famix model for the interfaces of a container
     * @param m A container (a source file or a namespace)
     * @param fmxScope The Famix model of the container
     */
    private processInterfaces(m: SourceFile | ModuleDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace): void {
        logger.debug(`processInterfaces: ---------- Finding Interfaces:`);
        m.getInterfaces().forEach(i => {
            const fmxInterface = this.processInterface(i);
            fmxScope.addType(fmxInterface);
        });
    }

    /**
     * Builds a Famix model for the variables of a container
     * @param m A container (a source file, a namespace, a function or a method)
     * @param fmxScope The Famix model of the container
     */
    private processVariables(m: SourceFile | ModuleDeclaration | FunctionDeclaration | FunctionExpression | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace | Famix.Function | Famix.Method | Famix.Accessor): void {
        logger.debug(`processVariables: ---------- Finding Variables:`);
        m.getVariableStatements().forEach(v => {
            const fmxVariables = this.processVariableStatement(v);
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
    private processEnums(m: SourceFile | ModuleDeclaration | FunctionDeclaration | FunctionExpression | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace | Famix.Function | Famix.Method | Famix.Accessor): void {
        logger.debug(`processEnums: ---------- Finding Enums:`);
        m.getEnums().forEach(e => {
            const fmxEnum = this.processEnum(e);
            fmxScope.addType(fmxEnum);
        });
    }

    /**
     * Builds a Famix model for the functions of a container
     * @param m A container (a source file, a namespace, a function or a method)
     * @param fmxScope The Famix model of the container
     */
    private processFunctions(m: SourceFile | ModuleDeclaration | FunctionDeclaration | FunctionExpression | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace | Famix.Function | Famix.Method | Famix.Accessor): void {
        logger.debug(`Finding Functions:`);
        m.getFunctions().forEach(f => {
            const fmxFunction = this.processFunction(f);
            fmxScope.addFunction(fmxFunction);
        });
    }

    /**
     * Builds a Famix model for the namespaces of a container
     * @param m A container (a source file or a namespace)
     * @param fmxScope The Famix model of the container
     */
    private processNamespaces(m: SourceFile | ModuleDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Namespace): void {
        logger.debug(`Finding Namespaces:`);
        m.getModules().forEach(md => {
            const fmxNsp = this.processNamespace(md);
            fmxScope.addNamespace(fmxNsp);
        });
    }

    /**
     * Builds a Famix model for an alias
     * @param a An alias
     * @returns A Famix.Alias representing the alias
     */
    private processAlias(a: TypeAliasDeclaration): Famix.Alias {
        const fmxAlias = this.famixFunctions.createFamixAlias(a);

        logger.debug(`Alias: ${a.getName()}, (${a.getType().getText()}), fqn = ${fmxAlias.getFullyQualifiedName()}`);

        this.processComments(a, fmxAlias);

        return fmxAlias;
    }

    /**
     * Builds a Famix model for a class
     * @param c A class
     * @returns A Famix.Class or a Famix.ParameterizableClass representing the class
     */
    private processClass(c: ClassDeclaration): Famix.Class | Famix.ParameterizableClass {
        this.classes.push(c);

        const fmxClass = this.famixFunctions.createOrGetFamixClass(c);

        logger.debug(`Class: ${c.getName()}, (${c.getType().getText()}), fqn = ${fmxClass.getFullyQualifiedName()}`);

        this.processComments(c, fmxClass);

        this.processDecorators(c, fmxClass);

        this.processStructuredType(c, fmxClass);

        c.getConstructors().forEach(con => {
            const fmxCon = this.processMethod(con);
            fmxClass.addMethod(fmxCon);
        });

        c.getGetAccessors().forEach(acc => {
            const fmxAcc = this.processMethod(acc);
            fmxClass.addMethod(fmxAcc);
        });
        
        c.getSetAccessors().forEach(acc => {
            const fmxAcc = this.processMethod(acc);
            fmxClass.addMethod(fmxAcc);
        });

        return fmxClass;
    }

    /**
     * Builds a Famix model for an interface
     * @param i An interface
     * @returns A Famix.Interface or a Famix.ParameterizableInterface representing the interface
     */
    private processInterface(i: InterfaceDeclaration): Famix.Interface | Famix.ParameterizableInterface {
        this.interfaces.push(i);

        const fmxInterface = this.famixFunctions.createOrGetFamixInterface(i);

        logger.debug(`Interface: ${i.getName()}, (${i.getType().getText()}), fqn = ${fmxInterface.getFullyQualifiedName()}`);

        this.processComments(i, fmxInterface);

        this.processStructuredType(i, fmxInterface);

        return fmxInterface;
    }

    /**
     * Builds a Famix model for the type parameters, properties and methods of a structured type
     * @param c A structured type (a class or an interface)
     * @param fmxScope The Famix model of the structured type
     */
    private processStructuredType(c: ClassDeclaration | InterfaceDeclaration, fmxScope: Famix.Class | Famix.ParameterizableClass | Famix.Interface | Famix.ParameterizableInterface): void {
        logger.debug(`Finding Properties and Methods:`);
        if (fmxScope instanceof Famix.ParameterizableClass || fmxScope instanceof Famix.ParameterizableInterface) {
            this.processTypeParameters(c, fmxScope);
        }

        c.getProperties().forEach(prop => {
            const fmxProperty = this.processProperty(prop);
            fmxScope.addProperty(fmxProperty);
        });

        c.getMethods().forEach(m => {
            const fmxMethod = this.processMethod(m);
            fmxScope.addMethod(fmxMethod);
        });
    }

    /**
     * Builds a Famix model for a property
     * @param p A property
     * @returns A Famix.Property representing the property
     */
    private processProperty(p: PropertyDeclaration | PropertySignature): Famix.Property {
        const fmxProperty = this.famixFunctions.createFamixProperty(p);

        logger.debug(`property: ${p.getName()}, (${p.getType().getText()}), fqn = ${fmxProperty.getFullyQualifiedName()}`);
        logger.debug(` ---> It's a Property${(p instanceof PropertySignature) ? "Signature" : "Declaration"}!`);
        const ancestor = p.getFirstAncestorOrThrow();
        logger.debug(` ---> Its first ancestor is a ${ancestor.getKindName()}`);

        if (!(p instanceof PropertySignature)) {
            this.processDecorators(p, fmxProperty);
            // only add access if the p's first ancestor is not a PropertyDeclaration
            if (ancestor.getKindName() !== "PropertyDeclaration") {
                logger.debug(`adding access: ${p.getName()}, (${p.getType().getText()}) Famix ${fmxProperty.getName()}`);
                this.accessMap.set(fmxProperty.id, p);
            }
        }

        this.processComments(p, fmxProperty);

        return fmxProperty;
    }

    /**
     * Builds a Famix model for a method or an accessor
     * @param m A method or an accessor
     * @returns A Famix.Method or a Famix.Accessor representing the method or the accessor
     */
    private processMethod(m: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration): Famix.Method | Famix.Accessor {
        const fmxMethod = this.famixFunctions.createFamixMethod(m, this.currentCC);

        logger.debug(`Method: ${!(m instanceof ConstructorDeclaration) ? m.getName() : "constructor"}, (${m.getType().getText()}), parent: ${(m.getParent() as ClassDeclaration | InterfaceDeclaration).getName()}, fqn = ${fmxMethod.getFullyQualifiedName()}`);

        this.processComments(m, fmxMethod);

        this.processTypeParameters(m, fmxMethod);

        this.processParameters(m, fmxMethod);

        if (!(m instanceof MethodSignature)) {
            this.processAliases(m, fmxMethod);

            this.processVariables(m, fmxMethod);

            this.processEnums(m, fmxMethod);

            this.processFunctions(m, fmxMethod);

            this.processFunctionExpressions(m, fmxMethod);

            this.methodsAndFunctionsWithId.set(fmxMethod.id, m);
        }

        if (m instanceof MethodDeclaration || m instanceof GetAccessorDeclaration || m instanceof SetAccessorDeclaration) {
            this.processDecorators(m, fmxMethod);
        }

        return fmxMethod;
    }

    /**
     * Builds a Famix model for a function
     * @param f A function
     * @returns A Famix.Function representing the function
     */
    private processFunction(f: FunctionDeclaration | FunctionExpression): Famix.Function {
        const fmxFunction = this.famixFunctions.createFamixFunction(f, this.currentCC);

        logger.debug(`Function: ${(f.getName()) ? f.getName() : "anonymous"}, (${f.getType().getText()}), fqn = ${fmxFunction.getFullyQualifiedName()}`);

        this.processComments(f, fmxFunction);

        this.processAliases(f, fmxFunction);

        this.processTypeParameters(f, fmxFunction);

        this.processParameters(f, fmxFunction);

        this.processVariables(f, fmxFunction);

        this.processEnums(f, fmxFunction);

        this.processFunctions(f, fmxFunction);

        if (f instanceof FunctionDeclaration && !(f.getParent() instanceof Block)) {
            this.processFunctionExpressions(f, fmxFunction);
        }

        this.methodsAndFunctionsWithId.set(fmxFunction.id, f);

        return fmxFunction;
    }

    /**
     * Builds a Famix model for the function expressions of a function or a method
     * @param f A function or a method
     * @param fmxScope The Famix model of the function or the method
     */
    private processFunctionExpressions(f: FunctionDeclaration | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration, fmxScope: Famix.Function | Famix.Method | Famix.Accessor): void {
        logger.debug(`Finding Function Expressions:`);
        const functionExpressions = f.getDescendantsOfKind(SyntaxKind.FunctionExpression);
        functionExpressions.forEach((func) => {
            const fmxFunc = this.processFunction(func);
            fmxScope.addFunction(fmxFunc);
        });
    }

    /**
     * Builds a Famix model for the parameters of a method or a function
     * @param m A method or a function
     * @param fmxScope The Famix model of the method or the function
     */
    private processParameters(m: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, fmxScope: Famix.Method | Famix.Accessor | Famix.Function): void {
        logger.debug(`Finding Parameters:`);
        m.getParameters().forEach(param => {
            const fmxParam = this.processParameter(param);
            fmxScope.addParameter(fmxParam);
        });
    }

    /**
     * Builds a Famix model for a parameter
     * @param p A parameter
     * @returns A Famix.Parameter representing the parameter
     */
    private processParameter(p: ParameterDeclaration): Famix.Parameter {
        const fmxParam = this.famixFunctions.createFamixParameter(p);

        logger.debug(`parameter: ${p.getName()}, (${p.getType().getText()}), fqn = ${fmxParam.getFullyQualifiedName()}`);

        this.processComments(p, fmxParam);

        this.processDecorators(p, fmxParam);

        const parent = p.getParent();

        if (!(parent instanceof MethodSignature)) {
            logger.debug(`adding access: ${p.getName()}, (${p.getType().getText()}) Famix ${fmxParam.getName()}`);
            this.accessMap.set(fmxParam.id, p);
        }

        return fmxParam;
    }

    /**
     * Builds a Famix model for the type parameters of a class, an interface, a method or a function
     * @param e A class, an interface, a method or a function
     * @param fmxScope The Famix model of the class, the interface, the method or the function
     */
    private processTypeParameters(e: ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, fmxScope: Famix.ParameterizableClass | Famix.ParameterizableInterface | Famix.Method | Famix.Accessor | Famix.Function): void {
        logger.debug(`Finding Type Parameters:`);
        e.getTypeParameters().forEach(tp => {
            const fmxParam = this.processTypeParameter(tp);
            fmxScope.addParameterType(fmxParam);
        });
    }

    /**
     * Builds a Famix model for a type parameter
     * @param tp A type parameter
     * @returns A Famix.TypeParameter representing the type parameter
     */
    private processTypeParameter(tp: TypeParameterDeclaration): Famix.ParameterType {
        const fmxTypeParameter = this.famixFunctions.createFamixParameterType(tp);

        logger.debug(`type parameter: ${tp.getName()}, (${tp.getType().getText()}), fqn = ${fmxTypeParameter.getFullyQualifiedName()}`);

        this.processComments(tp, fmxTypeParameter);

        return fmxTypeParameter;
    }

    /**
     * Builds a Famix model for the variables of a variable statement
     * @param v A variable statement
     * @returns An array of Famix.Variable representing the variables
     */
    private processVariableStatement(v: VariableStatement): Array<Famix.Variable> {
        const fmxVariables = new Array<Famix.Variable>();

        logger.debug(`Variable statement: ${v.getText()}, (${v.getType().getText()}), ${v.getDeclarationKindKeywords()[0]}, fqn = ${v.getDeclarations()[0].getName()}`);

        v.getDeclarations().forEach(variable => {
            const fmxVar = this.processVariable(variable);
            this.processComments(v, fmxVar);
            fmxVariables.push(fmxVar);
        }); 

        return fmxVariables;
    }

    /**
     * Builds a Famix model for a variable
     * @param v A variable
     * @returns A Famix.Variable representing the variable
     */
    private processVariable(v: VariableDeclaration): Famix.Variable {
        const fmxVar = this.famixFunctions.createFamixVariable(v);

        logger.debug(`variable: ${v.getName()}, (${v.getType().getText()}), ${v.getInitializer() ? "initializer: " + v.getInitializer().getText() : "initializer: "}, fqn = ${fmxVar.getFullyQualifiedName()}`);

        this.processComments(v, fmxVar);

        logger.debug(`adding access: ${v.getName()}, (${v.getType().getText()}) Famix ${fmxVar.getName()}`);
        this.accessMap.set(fmxVar.id, v);

        return fmxVar;
    }

    /**
     * Builds a Famix model for an enum
     * @param e An enum
     * @returns A Famix.Enum representing the enum
     */
    private processEnum(e: EnumDeclaration): Famix.Enum {
        const fmxEnum = this.famixFunctions.createFamixEnum(e);

        logger.debug(`enum: ${e.getName()}, (${e.getType().getText()}), fqn = ${fmxEnum.getFullyQualifiedName()}`);

        this.processComments(e, fmxEnum);

        e.getMembers().forEach(m => {
            const fmxEnumValue = this.processEnumValue(m);
            fmxEnum.addValue(fmxEnumValue);
        });

        return fmxEnum;
    }

    /**
     * Builds a Famix model for an enum member
     * @param v An enum member
     * @returns A Famix.EnumValue representing the enum member
     */
    private processEnumValue(v: EnumMember): Famix.EnumValue {
        const fmxEnumValue = this.famixFunctions.createFamixEnumValue(v);

        logger.debug(`enum value: ${v.getName()}, (${v.getType().getText()}), fqn = ${fmxEnumValue.getFullyQualifiedName()}`);

        this.processComments(v, fmxEnumValue);

        logger.debug(`adding access: ${v.getName()}, (${v.getType().getText()}) Famix ${fmxEnumValue.getName()}`);
        this.accessMap.set(fmxEnumValue.id, v);

        return fmxEnumValue;
    }

    /**
     * Builds a Famix model for the decorators of a class, a method, a parameter or a property
     * @param e A class, a method, a parameter or a property
     * @param fmxScope The Famix model of the class, the method, the parameter or the property
     */
    private processDecorators(e: ClassDeclaration | MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ParameterDeclaration | PropertyDeclaration, fmxScope: Famix.Class | Famix.ParameterizableClass | Famix.Method | Famix.Accessor | Famix.Parameter | Famix.Property): void {
        logger.debug(`Finding Decorators:`);
        e.getDecorators().forEach(dec => {
            const fmxDec = this.processDecorator(dec, e);
            fmxScope.addDecorator(fmxDec);
        });
    }

    /**
     * Builds a Famix model for a decorator
     * @param d A decorator
     * @param e A class, a method, a parameter or a property
     * @returns A Famix.Decorator representing the decorator
     */
    private processDecorator(d: Decorator, e: ClassDeclaration | MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ParameterDeclaration | PropertyDeclaration): Famix.Decorator {
        const fmxDec = this.famixFunctions.createOrGetFamixDecorator(d, e);

        logger.debug(`decorator: ${d.getName()}, (${d.getType().getText()}), fqn = ${fmxDec.getFullyQualifiedName()}`);

        this.processComments(d, fmxDec);

        return fmxDec;
    }

    /**
     * Builds a Famix model for the comments
     * @param e A ts-morph element
     * @param fmxScope The Famix model of the named entity
     */
    private processComments(e: SourceFile | ModuleDeclaration | ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | PropertyDeclaration | PropertySignature | Decorator | EnumDeclaration | EnumMember | TypeParameterDeclaration | VariableStatement | TypeAliasDeclaration, fmxScope: Famix.NamedEntity): void {
        logger.debug(`Process comments:`);
        e.getLeadingCommentRanges().forEach(c => {
            const fmxComment = this.processComment(c, fmxScope);
            logger.debug(`leading comments, addComment: '${c.getText()}'`);
            fmxScope.addComment(fmxComment); // redundant, but just in case
        });
        e.getTrailingCommentRanges().forEach(c => {
            const fmxComment = this.processComment(c, fmxScope);
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
    private processComment(c: CommentRange, fmxScope: Famix.NamedEntity): Famix.Comment {
        const isJSDoc = c.getText().startsWith("/**");
        logger.debug(`processComment: comment: ${c.getText()}, isJSDoc = ${isJSDoc}`);
        const fmxComment = this.famixFunctions.createFamixComment(c, fmxScope, isJSDoc);

        return fmxComment;
    }

    /**
     * Checks if the file has any imports or exports to be considered a module
     * @param sourceFile A source file
     * @returns A boolean indicating if the file is a module
     */
    private isModule(sourceFile: SourceFile): boolean {
        if (sourceFile.getImportDeclarations().length > 0 || sourceFile.getExportedDeclarations().size > 0) {
            this.exports.push(sourceFile.getExportedDeclarations());
            return true;
        }
        return false;
    }
}
