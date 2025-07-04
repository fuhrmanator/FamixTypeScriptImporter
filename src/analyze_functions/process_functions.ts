import { ClassDeclaration, MethodDeclaration, VariableStatement, FunctionDeclaration, VariableDeclaration, InterfaceDeclaration, ParameterDeclaration, ConstructorDeclaration, MethodSignature, SourceFile, ModuleDeclaration, PropertyDeclaration, PropertySignature, Decorator, GetAccessorDeclaration, SetAccessorDeclaration, ExportedDeclarations, CommentRange, EnumDeclaration, EnumMember, TypeParameterDeclaration, TypeAliasDeclaration, SyntaxKind, FunctionExpression, Block, Identifier, ExpressionWithTypeArguments, ImportDeclaration, Node, ArrowFunction, Scope, ClassExpression } from "ts-morph";
import * as Famix from "../lib/famix/model/famix";
import { calculate } from "../lib/ts-complex/cyclomatic-service";
import * as fs from 'fs';
import { logger } from "../analyze";
import { getFQN } from "../fqn";
import { EntityDictionary, InvocableType } from "src/famix_functions/EntityDictionary";

export type AccessibleTSMorphElement = ParameterDeclaration | VariableDeclaration | PropertyDeclaration | EnumMember;
export type FamixID = number;
    
type ContainerTypes = SourceFile | ModuleDeclaration | FunctionDeclaration | FunctionExpression | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ArrowFunction;

type ScopedTypes = Famix.ScriptEntity | Famix.Module | Famix.Function | Famix.Method | Famix.Accessor;

/**
 * Checks if the file has any imports or exports to be considered a module
 * @param sourceFile A source file
 * @returns A boolean indicating if the file is a module
 */
function isSourceFileAModule(sourceFile: SourceFile): boolean {
    return sourceFile.getImportDeclarations().length > 0 || sourceFile.getExportedDeclarations().size > 0;
}

export class TypeScriptToFamixProcessor  {
    private entityDictionary: EntityDictionary;

    public methodsAndFunctionsWithId = new Map<number, InvocableType>(); // Maps the Famix method, constructor, getter, setter and function ids to their ts-morph method, constructor, getter, setter or function object
    
    public accessMap = new Map<FamixID, AccessibleTSMorphElement>(); // Maps the Famix parameter, variable, property and enum value ids to their ts-morph parameter, variable, property or enum member object
    public classes = new Array<ClassDeclaration>(); // Array of all the classes of the source files
    public interfaces = new Array<InterfaceDeclaration>(); // Array of all the interfaces of the source files
    public modules = new Array<SourceFile>(); // Array of all the source files which are modules
    public listOfExportMaps = new Array<ReadonlyMap<string, ExportedDeclarations[]>>(); // Array of all the export maps
    private processedNodesWithTypeParams = new Set<number>(); // Set of nodes that have been processed and have type parameters

    private currentCC: { [key: string]: number }; // Stores the cyclomatic complexity metrics for the current source file

    constructor(entityDictionary: EntityDictionary) {
        this.entityDictionary = entityDictionary;
        this.currentCC = {};
    }

    /**
     * Gets the path of a module to be imported
     * @param importDecl An import declaration
     * @returns The path of the module to be imported
     */
    public getModulePath(importDecl: ImportDeclaration): string {
        let path: string;
        if (importDecl.getModuleSpecifierSourceFile() === undefined) {
            if (importDecl.getModuleSpecifierValue().substring(importDecl.getModuleSpecifierValue().length - 3) === ".ts") {
                path = importDecl.getModuleSpecifierValue();
            }
            else {
                path = importDecl.getModuleSpecifierValue() + ".ts";
            }
        }
        else {
            path = importDecl.getModuleSpecifierSourceFile()!.getFilePath();
        }
        return path;
    }
    
    
    /**
     * Gets the interfaces implemented or extended by a class or an interface
     * @param interfaces An array of interfaces
     * @param subClass A class or an interface
     * @returns An array of InterfaceDeclaration and ExpressionWithTypeArguments containing the interfaces implemented or extended by the subClass
     */
    public getImplementedOrExtendedInterfaces(interfaces: Array<InterfaceDeclaration>, subClass: ClassDeclaration | InterfaceDeclaration): Array<InterfaceDeclaration | ExpressionWithTypeArguments> {
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
    
    public processFiles(sourceFiles: Array<SourceFile>): void {
        sourceFiles.forEach(file => {
            logger.info(`File: >>>>>>>>>> ${file.getFilePath()}`);
    
            if (fs.existsSync(file.getFilePath())) {
                this.currentCC = calculate(file.getFilePath());
            } else {
                this.currentCC = {};
            }
    
            this.processFile(file);
        });
    }
    
    /**
     * Builds a Famix model for a source file
     * @param f A source file
     */
    private processFile(f: SourceFile): void {
        const isModule = isSourceFileAModule(f);
    
        if (isModule) {
            this.modules.push(f);
        }
    
        const exportMap = f.getExportedDeclarations();
        if (exportMap) this.listOfExportMaps.push(exportMap);
    
        const fmxFile = this.entityDictionary.createOrGetFamixFile(f, isModule);
    
        logger.debug(`processFile: file: ${f.getBaseName()}, fqn = ${fmxFile.fullyQualifiedName}`);
    
        this.processComments(f, fmxFile);
        this.processAliases(f, fmxFile);
        this.processClasses(f, fmxFile);
        this.processInterfaces(f, fmxFile); 
        this.processModules(f, fmxFile);
        this.processVariables(f, fmxFile); // This will handle our object literal methods
        this.processEnums(f, fmxFile);
        this.processFunctions(f, fmxFile);
    }
    
    /**
     * Builds a Famix model for a module (also namespace)
     * @param m A namespace
     * @returns A Famix.Module representing the module
     */
    private processModule(m: ModuleDeclaration): Famix.Module {
        const fmxModule = this.entityDictionary.createOrGetFamixModule(m);
    
        logger.debug(`module: ${m.getName()}, (${m.getType().getText()}), ${fmxModule.fullyQualifiedName}`);
    
        this.processComments(m, fmxModule);
    
        this.processAliases(m, fmxModule);
    
        this.processClasses(m, fmxModule);
    
        this.processInterfaces(m, fmxModule);
    
        this.processVariables(m, fmxModule);
    
        this.processEnums(m, fmxModule);
    
        this.processFunctions(m, fmxModule);
    
        this.processModules(m, fmxModule);
    
        return fmxModule;
    }
 
    /**
     * Builds a Famix model for the aliases of a container
     * @param m A container (a source file, a namespace, a function or a method)
     * @param fmxScope The Famix model of the container
     */
    private processAliases(m: ContainerTypes, fmxScope: ScopedTypes): void {
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
    private processClasses(m: SourceFile | ModuleDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module): void {
        logger.debug(`processClasses: ---------- Finding Classes:`);
        const classesInArrowFunctions = this.getClassesDeclaredInArrowFunctions(m);
        const classes = m.getClasses().concat(classesInArrowFunctions);
        classes.forEach(c => {
            const fmxClass = this.processClass(c);
            fmxScope.addType(fmxClass);
        });
    }
    
    private getArrowFunctionClasses(f: ArrowFunction): ClassDeclaration[] {
        const classes: ClassDeclaration[] = [];
    
        function findClasses(node: Node) {
            if (node.getKind() === SyntaxKind.ClassDeclaration) {
                classes.push(node as ClassDeclaration);
            }
            node.getChildren().forEach(findClasses);
        }
    
        findClasses(f);
        return classes;
    }
    
    /**
     * ts-morph doesn't find classes in arrow functions, so we need to find them manually
     * @param s A source file 
     * @returns the ClassDeclaration objects found in arrow functions of the source file
     */
    private getClassesDeclaredInArrowFunctions(s: SourceFile | ModuleDeclaration): ClassDeclaration[] {
        const arrowFunctions = s.getDescendantsOfKind(SyntaxKind.ArrowFunction);
        const classesInArrowFunctions = arrowFunctions.map(f => this.getArrowFunctionClasses(f)).flat();
        return classesInArrowFunctions;
    }
    
    /**
     * Builds a Famix model for the interfaces of a container
     * @param m A container (a source file or a namespace)
     * @param fmxScope The Famix model of the container
     */
    private processInterfaces(m: SourceFile | ModuleDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module): void {
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
    private processVariables(m: ContainerTypes, fmxScope: Famix.ScriptEntity | Famix.Module | Famix.Function | Famix.Method | Famix.Accessor): void {
        logger.debug(`processVariables: ---------- Finding Variables:`);
        m.getVariableStatements().forEach(v => {
            const fmxVariables = this.processVariableStatement(v);
            fmxVariables.forEach(fmxVariable => {
                fmxScope.addVariable(fmxVariable);
            });
    
            // Check each VariableDeclaration for object literal methods
            v.getDeclarations().forEach(varDecl => {
                const varName = varDecl.getName();
                console.log(`Checking variable: ${varName} at pos=${varDecl.getStart()}`);
                const initializer = varDecl.getInitializer();
                if (initializer && Node.isObjectLiteralExpression(initializer)) {
                    initializer.getProperties().forEach(prop => {
                        if (Node.isPropertyAssignment(prop)) {
                            const nested = prop.getInitializer();
                            if (nested && Node.isObjectLiteralExpression(nested)) {
                                nested.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach(method => {
                                    console.log(`Found object literal method: ${method.getName()} at pos=${method.getStart()}`);
                                    this.entityDictionary.createOrGetFamixMethod(method, this.currentCC);
                                });
                            }
                        }
                    });
                }
            });
        });
    }
    
    /**
     * Builds a Famix model for the enums of a container
     * @param m A container (a source file, a namespace, a function or a method)
     * @param fmxScope The Famix model of the container
     */
    private processEnums(m: ContainerTypes, fmxScope: ScopedTypes): void {
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
    private processFunctions(m: ContainerTypes, fmxScope: ScopedTypes): void {
        logger.debug(`Finding Functions:`);
        m.getFunctions().forEach(f => {
            const fmxFunction = this.processFunction(f);
            fmxScope.addFunction(fmxFunction);
        });
    
        //find arrow functions
        logger.debug(`Finding Functions:`);
        const arrowFunctions = m.getDescendantsOfKind(SyntaxKind.ArrowFunction);
        arrowFunctions.forEach(af => {
            const fmxFunction = this.processFunction(af);
            fmxScope.addFunction(fmxFunction);
        });
    }
    
    /**
     * Builds a Famix model for the modules of a container.
     * @param m A container (a source file or a namespace)
     * @param fmxScope The Famix model of the container
     */
    private processModules(m: SourceFile | ModuleDeclaration, fmxScope: Famix.ScriptEntity | Famix.Module): void {
        logger.debug(`Finding Modules:`);
        m.getModules().forEach(md => {
            const fmxModule = this.processModule(md);
            fmxScope.addModule(fmxModule);
        });
    }
    
    /**
     * Builds a Famix model for an alias
     * @param a An alias
     * @returns A Famix.Alias representing the alias
     */
    private processAlias(a: TypeAliasDeclaration): Famix.Alias {
        const fmxAlias = this.entityDictionary.createFamixAlias(a);
    
        logger.debug(`Alias: ${a.getName()}, (${a.getType().getText()}), fqn = ${fmxAlias.fullyQualifiedName}`);
    
        this.processComments(a, fmxAlias);
    
        return fmxAlias;
    }
    
    /**
     * Builds a Famix model for a class
     * @param c A class
     * @returns A Famix.Class or a Famix.ParametricClass representing the class
     */
    private processClass(c: ClassDeclaration): Famix.Class | Famix.ParametricClass {
        this.classes.push(c);
    
        const fmxClass = this.entityDictionary.createOrGetFamixClass(c);
    
        logger.debug(`Class: ${c.getName()}, (${c.getType().getText()}), fqn = ${fmxClass.fullyQualifiedName}`);
    
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
     * @returns A Famix.Interface or a Famix.ParametricInterface representing the interface
     */
    private processInterface(i: InterfaceDeclaration): Famix.Interface | Famix.ParametricInterface {
        this.interfaces.push(i);
    
        const fmxInterface = this.entityDictionary.createOrGetFamixInterface(i);
    
        logger.debug(`Interface: ${i.getName()}, (${i.getType().getText()}), fqn = ${fmxInterface.fullyQualifiedName}`);
    
        this.processComments(i, fmxInterface);
    
        this.processStructuredType(i, fmxInterface);
    
        return fmxInterface;
    }
    
    /**
     * Builds a Famix model for the type parameters, properties and methods of a structured type
     * @param c A structured type (a class or an interface)
     * @param fmxScope The Famix model of the structured type
     */
    private processStructuredType(c: ClassDeclaration | InterfaceDeclaration, fmxScope: Famix.Class | Famix.ParametricClass | Famix.Interface | Famix.ParametricInterface): void {
        logger.debug(`Finding Properties and Methods:`);
        if (fmxScope instanceof Famix.ParametricClass || fmxScope instanceof Famix.ParametricInterface) {
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
        const fmxProperty = this.entityDictionary.createFamixProperty(p);
    
        logger.debug(`property: ${p.getName()}, (${p.getType().getText()}), fqn = ${fmxProperty.fullyQualifiedName}`);
        logger.debug(` ---> It's a Property${(p instanceof PropertySignature) ? "Signature" : "Declaration"}!`);
        const ancestor = p.getFirstAncestorOrThrow();
        logger.debug(` ---> Its first ancestor is a ${ancestor.getKindName()}`);
    
        // decorators
        if (!(p instanceof PropertySignature)) {
            this.processDecorators(p, fmxProperty);
            // only add access if the p's first ancestor is not a PropertyDeclaration
            if (ancestor.getKindName() !== "PropertyDeclaration") {
                logger.debug(`adding access to map: ${p.getName()}, (${p.getType().getText()}) Famix ${fmxProperty.name} id: ${fmxProperty.id}`);
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
        const fmxMethod = this.entityDictionary.createOrGetFamixMethod(m, this.currentCC);
    
        logger.debug(`Method: ${!(m instanceof ConstructorDeclaration) ? m.getName() : "constructor"}, (${m.getType().getText()}), parent: ${(m.getParent() as ClassDeclaration | InterfaceDeclaration).getName()}, fqn = ${fmxMethod.fullyQualifiedName}`);
    
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
    private processFunction(f: FunctionDeclaration | FunctionExpression | ArrowFunction): Famix.Function {
    
        logger.debug(`Function: ${(f instanceof ArrowFunction ? "anonymous" : f.getName() ? f.getName() : "anonymous")}, (${f.getType().getText()}), fqn = ${getFQN(f, this.entityDictionary.getAbsolutePath())}`);
    
        let fmxFunction;
        if (f instanceof ArrowFunction) {
            fmxFunction = this.entityDictionary.createOrGetFamixArrowFunction(f, this.currentCC);
        } else {
            fmxFunction = this.entityDictionary.createOrGetFamixFunction(f, this.currentCC);
        }
    
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
    private processParameters(m: MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ArrowFunction, fmxScope: Famix.Method | Famix.Accessor | Famix.Function): void {
        logger.debug(`Finding Parameters:`);
        m.getParameters().forEach(param => {
            const fmxParam = this.processParameter(param);
            fmxScope.addParameter(fmxParam);
            // Additional handling for Parameter Properties in constructors
            if (m instanceof ConstructorDeclaration) {
                // Check if the parameter has any visibility modifier
                if (param.hasModifier(SyntaxKind.PrivateKeyword) || param.hasModifier(SyntaxKind.PublicKeyword) || param.hasModifier(SyntaxKind.ProtectedKeyword) || param.hasModifier(SyntaxKind.ReadonlyKeyword)) {
                    const classOfConstructor = m.getParent();
                    logger.info(`Parameter Property ${param.getName()} in constructor of ${classOfConstructor.getName()}.`);
                    // Treat the parameter as a property and add it to the class
                    const fmxProperty = this.processParameterAsProperty(param, classOfConstructor);
                    fmxProperty.readOnly = param.hasModifier(SyntaxKind.ReadonlyKeyword);
                }
            }
    
        });
    }
    
    // This function should create a Famix.Property model from a ParameterDeclaration
    // You'll need to implement it according to your Famix model structure
    private processParameterAsProperty(param: ParameterDeclaration, classDecl: ClassDeclaration | ClassExpression): Famix.Property {
        // Convert the parameter into a Property
        const propertyRepresentation = this.convertParameterToPropertyRepresentation(param);
    
        // Add the property to the class so we can have a PropertyDeclaration object
        classDecl.addProperty(propertyRepresentation);
    
        const property = classDecl.getProperty(propertyRepresentation.name);
        if (!property) {
            throw new Error(`Property ${propertyRepresentation.name} not found in class ${classDecl.getName()}`);
        }
        const fmxProperty = this.entityDictionary.createFamixProperty(property);
        if (classDecl instanceof ClassDeclaration) {
            const fmxClass = this.entityDictionary.createOrGetFamixClass(classDecl);
            fmxClass.addProperty(fmxProperty);
        } else {
            throw new Error("Unexpected type ClassExpression.");
        }
    
        this.processComments(property, fmxProperty);
    
        // remove the property from the class
        property.remove();
    
        return fmxProperty;
    
    }
    
    private convertParameterToPropertyRepresentation(param: ParameterDeclaration) {
        // Extract name
        const paramName = param.getName();
    
        // Extract type
        const paramType = param.getType().getText(param);
    
        // Determine visibility
        let scope: Scope;
        if (param.hasModifier(SyntaxKind.PrivateKeyword)) {
            scope = Scope.Private;
        } else if (param.hasModifier(SyntaxKind.ProtectedKeyword)) {
            scope = Scope.Protected;
        } else if (param.hasModifier(SyntaxKind.PublicKeyword)) {
            scope = Scope.Public;
        } else {
            throw new Error(`Parameter property ${paramName} in constructor does not have a visibility modifier.`);
        }
    
        // Determine if readonly
        const isReadonly = param.hasModifier(SyntaxKind.ReadonlyKeyword);
    
        // Create a representation of the property
        const propertyRepresentation = {
            name: paramName,
            type: paramType,
            scope: scope,
            isReadonly: isReadonly,
        };
    
        return propertyRepresentation;
    }
    
    /**
     * Builds a Famix model for a parameter
     * @param paramDecl A parameter
     * @returns A Famix.Parameter representing the parameter
     */
    private processParameter(paramDecl: ParameterDeclaration): Famix.Parameter {
        const fmxParam = this.entityDictionary.createOrGetFamixParameter(paramDecl);  // create or GET
    
        logger.debug(`parameter: ${paramDecl.getName()}, (${paramDecl.getType().getText()}), fqn = ${fmxParam.fullyQualifiedName}`);
    
        this.processComments(paramDecl, fmxParam);
    
        this.processDecorators(paramDecl, fmxParam);
    
        const parent = paramDecl.getParent();
    
        if (!(parent instanceof MethodSignature)) {
            logger.debug(`adding access: ${paramDecl.getName()}, (${paramDecl.getType().getText()}) Famix ${fmxParam.name}`);
            this.accessMap.set(fmxParam.id, paramDecl);
        }
    
        return fmxParam;
    }
    
    private processTypeParameters(
        e: ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ArrowFunction,
        fmxScope: Famix.ParametricClass | Famix.ParametricInterface | Famix.Method | Famix.Accessor | Famix.Function | Famix.ArrowFunction
    ): void {
        logger.debug(`Finding Type Parameters:`);
        const nodeStart = e.getStart();
    
        // Check if this node has already been processed
        if (this.processedNodesWithTypeParams.has(nodeStart)) {
            return;
        }
    
        // Get type parameters
        const typeParams = e.getTypeParameters();
    
        // Process each type parameter
        typeParams.forEach((tp) => {
            const fmxParam = this.processTypeParameter(tp);
            fmxScope.addGenericParameter(fmxParam);
        });
    
        // Log if no type parameters were found
        if (typeParams.length === 0) {
            logger.debug(`[processTypeParameters] No type parameters found for this node`);
        }
    
        // Mark this node as processed
        this.processedNodesWithTypeParams.add(nodeStart);
    }
    
    /**
     * Builds a Famix model for a type parameter
     * @param tp A type parameter
     * @returns A Famix.TypeParameter representing the type parameter
     */
    private processTypeParameter(tp: TypeParameterDeclaration): Famix.ParameterType {
        const fmxTypeParameter = this.entityDictionary.createFamixParameterType(tp);
        logger.debug(`type parameter: ${tp.getName()}, (${tp.getType().getText()}), fqn = ${fmxTypeParameter.fullyQualifiedName}`);
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
        const fmxVar = this.entityDictionary.createOrGetFamixVariable(v);
    
        logger.debug(`variable: ${v.getName()}, (${v.getType().getText()}), ${v.getInitializer() ? "initializer: " + v.getInitializer()!.getText() : "initializer: "}, fqn = ${fmxVar.fullyQualifiedName}`);
    
        this.processComments(v, fmxVar);
    
        logger.debug(`adding access: ${v.getName()}, (${v.getType().getText()}) Famix ${fmxVar.name}`);
        this.accessMap.set(fmxVar.id, v);
    
        return fmxVar;
    }
    
    /**
     * Builds a Famix model for an enum
     * @param e An enum
     * @returns A Famix.Enum representing the enum
     */
    private processEnum(e: EnumDeclaration): Famix.Enum {
        const fmxEnum = this.entityDictionary.createOrGetFamixEnum(e);
    
        logger.debug(`enum: ${e.getName()}, (${e.getType().getText()}), fqn = ${fmxEnum.fullyQualifiedName}`);
    
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
        const fmxEnumValue = this.entityDictionary.createFamixEnumValue(v);
    
        logger.debug(`enum value: ${v.getName()}, (${v.getType().getText()}), fqn = ${fmxEnumValue.fullyQualifiedName}`);
    
        this.processComments(v, fmxEnumValue);
    
        logger.debug(`adding access: ${v.getName()}, (${v.getType().getText()}) Famix ${fmxEnumValue.name}`);
        this.accessMap.set(fmxEnumValue.id, v);
    
        return fmxEnumValue;
    }
    
    /**
     * Builds a Famix model for the decorators of a class, a method, a parameter or a property
     * @param e A class, a method, a parameter or a property
     * @param fmxScope The Famix model of the class, the method, the parameter or the property
     */
    private processDecorators(e: ClassDeclaration | MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ParameterDeclaration | PropertyDeclaration, fmxScope: Famix.Class | Famix.ParametricClass | Famix.Method | Famix.Accessor | Famix.Parameter | Famix.Property): void {
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
        const fmxDec = this.entityDictionary.createOrGetFamixDecorator(d, e);
    
        logger.debug(`decorator: ${d.getName()}, (${d.getType().getText()}), fqn = ${fmxDec.fullyQualifiedName}`);
    
        this.processComments(d, fmxDec);
    
        return fmxDec;
    }
    
    /**
     * Builds a Famix model for the comments
     * @param e A ts-morph element
     * @param fmxScope The Famix model of the named entity
     */
    private processComments(e: SourceFile | ModuleDeclaration | ClassDeclaration | InterfaceDeclaration | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | PropertyDeclaration | PropertySignature | Decorator | EnumDeclaration | EnumMember | TypeParameterDeclaration | VariableStatement | TypeAliasDeclaration | ArrowFunction, fmxScope: Famix.NamedEntity): void {
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
        const fmxComment = this.entityDictionary.createFamixComment(c, fmxScope, isJSDoc);
    
        return fmxComment;
    }
    
    /**
     * Builds a Famix model for the accesses on the parameters, variables, properties and enum members of the source files
     * @param accessMap A map of parameters, variables, properties and enum members with their id
     */
    public processAccesses(accessMap: Map<FamixID, AccessibleTSMorphElement>): void {
        logger.debug(`Creating accesses:`);
        accessMap.forEach((v, id) => {
            logger.debug(`Accesses to ${v.getName()}`);
            // try {
            const temp_nodes = v.findReferencesAsNodes() as Array<Identifier>;
            temp_nodes.forEach(node => this.processNodeForAccesses(node, id));
            // } catch (error) {
            //     logger.error(`> WARNING: got exception "${error}".\nContinuing...`);
            // }
        });
    }
    
    /**
     * Builds a Famix model for an access on a parameter, variable, property or enum member
     * @param n A node
     * @param id An id of a parameter, a variable, a property or an enum member
     */
    private processNodeForAccesses(n: Identifier, id: number): void {
        // try {
        // sometimes node's first ancestor is a PropertyDeclaration, which is not an access
        // see https://github.com/fuhrmanator/FamixTypeScriptImporter/issues/9
        // check for a node whose first ancestor is a property declaration and bail?
        // This may be a bug in ts-morph?
        if (n.getFirstAncestorOrThrow().getKindName() === "PropertyDeclaration") {
            logger.debug(`processNodeForAccesses: node kind: ${n.getKindName()}, ${n.getText()}, (${n.getType().getText()})'s first ancestor is a PropertyDeclaration. Skipping...`);
            return;
        }
        this.entityDictionary.createFamixAccess(n, id);
        logger.debug(`processNodeForAccesses: node kind: ${n.getKindName()}, ${n.getText()}, (${n.getType().getText()})`);
        // } catch (error) {
        //     logger.error(`> Got exception "${error}".\nScopeDeclaration invalid for "${n.getSymbol().fullyQualifiedName}".\nContinuing...`);
        // }
    }
    
    
    // exports has name -> Declaration -- the declaration can be used to find the FamixElement
    
    // handle `import path = require("path")` for example
    public processImportClausesForImportEqualsDeclarations(sourceFiles: Array<SourceFile>, exports: Array<ReadonlyMap<string, ExportedDeclarations[]>>): void {
        logger.info(`Creating import clauses from ImportEqualsDeclarations in source files:`);
        sourceFiles.forEach(sourceFile => {
            sourceFile.forEachDescendant(node => {
                if (Node.isImportEqualsDeclaration(node)) {
                    // You've found an ImportEqualsDeclaration
                    logger.info("Declaration Name:", node.getName());
                    logger.info("Module Reference Text:", node.getModuleReference().getText());
                    // what's the name of the imported entity?
                    // const importedEntity = node.getName();
                    // create a famix import clause
                    const namedImport = node.getNameNode();
                    this.entityDictionary.oldCreateOrGetFamixImportClause({
                        importDeclaration: node,
                        importerSourceFile: sourceFile,
                        moduleSpecifierFilePath: node.getModuleReference().getText(),
                        importElement: namedImport,
                        isInExports: exports.find(e => e.has(namedImport.getText())) !== undefined,
                        isDefaultExport: false
                    });
                    // this.entityDictionary.createFamixImportClause(importedEntity, importingEntity);
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
    public processImportClausesForModules(modules: Array<SourceFile>, exports: Array<ReadonlyMap<string, ExportedDeclarations[]>>): void {
        logger.info(`Creating import clauses from ${modules.length} modules:`);
        modules.forEach(module => {
            const modulePath = module.getFilePath();
            module.getImportDeclarations().forEach(impDecl => {
                logger.info(`Importing ${impDecl.getModuleSpecifierValue()} in ${modulePath}`);
                const path = this.getModulePath(impDecl);
    
                impDecl.getNamedImports().forEach(namedImport => {
                    logger.info(`Importing (named) ${namedImport.getName()} from ${impDecl.getModuleSpecifierValue()} in ${modulePath}`);
                    const importedEntityName = namedImport.getName();
                    const importFoundInExports = this.isInExports(exports, importedEntityName);
                    logger.debug(`Processing ImportSpecifier: ${namedImport.getText()}, pos=${namedImport.getStart()}`);
                    this.entityDictionary.oldCreateOrGetFamixImportClause({
                        importDeclaration: impDecl,
                        importerSourceFile: module,
                        moduleSpecifierFilePath: path,
                        importElement: namedImport,
                        isInExports: importFoundInExports,
                        isDefaultExport: false
                    });
                });
    
                const defaultImport = impDecl.getDefaultImport();
                if (defaultImport !== undefined) {
                    logger.info(`Importing (default) ${defaultImport.getText()} from ${impDecl.getModuleSpecifierValue()} in ${modulePath}`);
                    logger.debug(`Processing Default Import: ${defaultImport.getText()}, pos=${defaultImport.getStart()}`);
                    this.entityDictionary.oldCreateOrGetFamixImportClause({
                        importDeclaration: impDecl,
                        importerSourceFile: module,
                        moduleSpecifierFilePath: path,
                        importElement: defaultImport,
                        isInExports: false,
                        isDefaultExport: true
                    });
                }
    
                const namespaceImport = impDecl.getNamespaceImport();
                if (namespaceImport !== undefined) {
                    logger.info(`Importing (namespace) ${namespaceImport.getText()} from ${impDecl.getModuleSpecifierValue()} in ${modulePath}`);
                    this.entityDictionary.oldCreateOrGetFamixImportClause({
                        importDeclaration: impDecl,
                        importerSourceFile: module,
                        moduleSpecifierFilePath: path,
                        importElement: namespaceImport,
                        isInExports: false,
                        isDefaultExport: false
                    });
                }
            });
        });
    }
    
    private isInExports(exports: ReadonlyMap<string, ExportedDeclarations[]>[], importedEntityName: string) {
        let importFoundInExports = false;
        exports.forEach(e => {
            if (e.has(importedEntityName)) {
                importFoundInExports = true;
            }
        });
        return importFoundInExports;
    }
    
    /**
     * Builds a Famix model for the inheritances of the classes and interfaces of the source files
     * @param classes An array of classes
     * @param interfaces An array of interfaces
     */
    public processInheritances(classes: ClassDeclaration[], interfaces: InterfaceDeclaration[]): void {
        logger.info(`Creating inheritances:`);
        classes.forEach(cls => {
            logger.debug(`Checking class inheritance for ${cls.getName()}`);
                const baseClass = cls.getBaseClass();
                if (baseClass !== undefined) {
                    this.entityDictionary.createOrGetFamixInheritance(cls, baseClass);
                    logger.debug(`class: ${cls.getName()}, (${cls.getType().getText()}), extClass: ${baseClass.getName()}, (${baseClass.getType().getText()})`);
                } // this is false when the class extends an undefined class
                else {
                    // check for "extends" of unresolved class
                    const undefinedExtendedClass = cls.getExtends();
                    if (undefinedExtendedClass) {
                        this.entityDictionary.createOrGetFamixInheritance(cls, undefinedExtendedClass);
                        logger.debug(`class: ${cls.getName()}, (${cls.getType().getText()}), undefinedExtendedClass: ${undefinedExtendedClass.getText()}`);
                    }
                }
    
                logger.debug(`Checking interface inheritance for ${cls.getName()}`);
                const implementedInterfaces = this.getImplementedOrExtendedInterfaces(interfaces, cls);
                implementedInterfaces.forEach(implementedIF => {
                    this.entityDictionary.createOrGetFamixInheritance(cls, implementedIF);
                    logger.debug(`class: ${cls.getName()}, (${cls.getType().getText()}), impInter: ${(implementedIF instanceof InterfaceDeclaration) ? implementedIF.getName() : implementedIF.getExpression().getText()}, (${(implementedIF instanceof InterfaceDeclaration) ? implementedIF.getType().getText() : implementedIF.getExpression().getText()})`);
                });
        });
    
        interfaces.forEach(interFace => {
            try {
                logger.debug(`Checking interface inheritance for ${interFace.getName()}`);
                const extendedInterfaces = this.getImplementedOrExtendedInterfaces(interfaces, interFace);
                extendedInterfaces.forEach(extendedInterface => {
                    this.entityDictionary.createOrGetFamixInheritance(interFace, extendedInterface);
    
                    logger.debug(`interFace: ${interFace.getName()}, (${interFace.getType().getText()}), extendedInterface: ${(extendedInterface instanceof InterfaceDeclaration) ? extendedInterface.getName() : extendedInterface.getExpression().getText()}, (${(extendedInterface instanceof InterfaceDeclaration) ? extendedInterface.getType().getText() : extendedInterface.getExpression().getText()})`);
                });
            }
            catch (error) {
                logger.error(`> WARNING: got exception ${error}. Continuing...`);
            }
        });
    }
    
    /**
     * Builds a Famix model for the invocations of the methods and functions of the source files
     * @param methodsAndFunctionsWithId A map of methods and functions with their id
     */
    public processInvocations(methodsAndFunctionsWithId: Map<number, InvocableType>): void {
        logger.info(`Creating invocations:`);
        methodsAndFunctionsWithId.forEach((invocable, id) => {
            if (!(invocable instanceof ArrowFunction)) {  // ArrowFunctions are not directly invoked
                logger.debug(`Invocations to ${(invocable instanceof MethodDeclaration || invocable instanceof GetAccessorDeclaration || invocable instanceof SetAccessorDeclaration || invocable instanceof FunctionDeclaration) ? invocable.getName() : ((invocable instanceof ConstructorDeclaration) ? 'constructor' : (invocable.getName() ? invocable.getName() : 'anonymous'))} (${invocable.getType().getText()})`);
                try {
                    const nodesReferencingInvocable = invocable.findReferencesAsNodes() as Array<Identifier>;
                    nodesReferencingInvocable.forEach(
                        nodeReferencingInvocable => this.processNodeForInvocations(nodeReferencingInvocable, invocable, id));
                } catch (error) {
                    logger.error(`> WARNING: got exception ${error}. Continuing...`);
                }
            } else {
                logger.debug(`Skipping invocation to ArrowFunction: ${(invocable.getBodyText())}`);
            }
        });
    }
    
    /**
     * Builds a Famix model for an invocation of a method or a function
     * @param nodeReferencingInvocable A node
     * @param invocable A method or a function
     * @param id The id of the method or the function
     */
    private processNodeForInvocations(nodeReferencingInvocable: Identifier, invocable: InvocableType, id: number): void {
        try {
            this.entityDictionary.createFamixInvocation(nodeReferencingInvocable, invocable, id);
            logger.debug(`node: ${nodeReferencingInvocable.getKindName()}, (${nodeReferencingInvocable.getType().getText()})`);
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. ScopeDeclaration invalid for ${nodeReferencingInvocable.getSymbol()!.getFullyQualifiedName()}. Continuing...`);
        }
    }
    
    /**
     * Builds a Famix model for the inheritances of the classes and interfaces of the source files
     * @param classes An array of classes
     * @param interfaces An array of interfaces
     */
    public processConcretisations(classes: ClassDeclaration[], interfaces: InterfaceDeclaration[], functions: Map<number, MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ArrowFunction>): void {
        logger.info(`processConcretisations: Creating concretisations:`);
        classes.forEach(cls => {
            logger.debug(`processConcretisations: Checking class concretisation for ${cls.getName()}`);
            this.entityDictionary.createFamixConcretisationClassOrInterfaceSpecialisation(cls);
            this.entityDictionary.createFamixConcretisationGenericInstantiation(cls);
            this.entityDictionary.createFamixConcretisationInterfaceClass(cls);
            this.entityDictionary.createFamixConcretisationTypeInstanciation(cls);
    
        });
        interfaces.forEach(inter => {
            logger.debug(`processConcretisations: Checking interface concretisation for ${inter.getName()}`);
            this.entityDictionary.createFamixConcretisationTypeInstanciation(inter);
            this.entityDictionary.createFamixConcretisationClassOrInterfaceSpecialisation(inter);
        });
        functions.forEach(func => {
            if(func instanceof FunctionDeclaration || func instanceof MethodDeclaration ){
                logger.debug(`processConcretisations: Checking Method concretisation`);
                this.entityDictionary.createFamixConcretisationFunctionInstantiation(func);
            }
        });
    }
}
    
export function isAmbient(node: ModuleDeclaration): boolean {
    // An ambient module has the DeclareKeyword modifier.
    return (node.getModifiers()?.some(modifier => modifier.getKind() === SyntaxKind.DeclareKeyword)) ?? false;
}

export function isNamespace(node: ModuleDeclaration): boolean {
    // Check if the module declaration has a namespace keyword.
    // This approach uses the getChildren() method to inspect the syntax directly.
    return node.getChildrenOfKind(SyntaxKind.NamespaceKeyword).length > 0;
}
