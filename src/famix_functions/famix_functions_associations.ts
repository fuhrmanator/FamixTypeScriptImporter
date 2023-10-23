import { ClassDeclaration, ConstructorDeclaration, FunctionDeclaration, Identifier, InterfaceDeclaration, MethodDeclaration, SourceFile, GetAccessorDeclaration, SetAccessorDeclaration, Node, ImportSpecifier, SyntaxKind, FunctionExpression, ExpressionWithTypeArguments, ImportDeclaration, ImportEqualsDeclaration } from "ts-morph";
import * as Famix from "../lib/famix/src/model/famix";
import { FamixRepository } from "../lib/famix/src/famix_repository";
import { FQNFunctions } from "../fqn";
import { FamixFunctionsIndex } from "./famix_functions_index";
import { logger } from "../analyze";

/**
 * This class is used to build a Famix model for the associations
 */
export class FamixFunctionsAssociations {

    private famixRep: FamixRepository; // The Famix repository
    private FQNFunctions = new FQNFunctions(); // The fully qualified name functions
    private famixClassMap: Map<string, Famix.Class | Famix.ParameterizableClass>; // Maps the class names to their Famix model
    private famixInterfaceMap: Map<string, Famix.Interface | Famix.ParameterizableInterface>; // Maps the interface names to their Famix model
    private famixFunctionsIndex: FamixFunctionsIndex; // FamixFunctionsIndex object, it contains all the functions needed to create Famix index file anchors

    /**
     * Initializes the FamixFunctionsAssociations object
     * @param famixRep The Famix repository
     * @param fmxClassMap The map of the class names and their Famix model
     * @param fmxInterfaceMap The map of the interface names and their Famix model
     */
    constructor(famixRep: FamixRepository, fmxClassMap: Map<string, Famix.Class | Famix.ParameterizableClass>, fmxInterfaceMap: Map<string, Famix.Interface | Famix.ParameterizableInterface>) {
        this.famixRep = famixRep;
        this.famixClassMap = fmxClassMap;
        this.famixInterfaceMap = fmxInterfaceMap;
        this.famixFunctionsIndex = new FamixFunctionsIndex(famixRep);
    }

    /**
     * Creates a Famix access
     * @param node A node
     * @param id An id of a parameter, a variable, a property or an enum member
     */
    public createFamixAccess(node: Identifier, id: number): void {
        const fmxVar = this.famixRep.getFamixEntityById(id) as Famix.StructuralEntity;
        const nodeReferenceAncestor = this.findAncestor(node);
        const ancestorFullyQualifiedName = this.FQNFunctions.getFQN(nodeReferenceAncestor);
        const accessor = this.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;

        const fmxAccess = new Famix.Access(this.famixRep);
        fmxAccess.setAccessor(accessor);
        fmxAccess.setVariable(fmxVar);

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(node, fmxAccess);
    }

    /**
     * Creates a Famix invocation
     * @param node A node
     * @param m A method or a function
     * @param id The id of the method or the function
     */
    public createFamixInvocation(node: Identifier, m: MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, id: number): void {
        const fmxMethodOrFunction = this.getFamixEntityById(id) as Famix.BehavioralEntity;
        const nodeReferenceAncestor = this.findAncestor(node);
        const ancestorFullyQualifiedName = this.FQNFunctions.getFQN(nodeReferenceAncestor);
        const sender = this.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
        const receiverFullyQualifiedName = this.FQNFunctions.getFQN(m.getParent());
        const receiver = this.getFamixEntityByFullyQualifiedName(receiverFullyQualifiedName) as Famix.NamedEntity;

        const fmxInvocation = new Famix.Invocation(this.famixRep);
        fmxInvocation.setSender(sender);
        fmxInvocation.setReceiver(receiver);
        fmxInvocation.addCandidate(fmxMethodOrFunction);
        fmxInvocation.setSignature(fmxMethodOrFunction.getSignature());

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(node, fmxInvocation);
    }

    /**
     * Creates a Famix inheritance
     * @param cls A class or an interface (subclass)
     * @param inhClass The inherited class or interface (superclass)
     */
    public createFamixInheritance(cls: ClassDeclaration | InterfaceDeclaration, inhClass: ClassDeclaration | InterfaceDeclaration | ExpressionWithTypeArguments): void {
        const fmxInheritance = new Famix.Inheritance(this.famixRep);
        // const clsName = cls.getName();
        const classFullyQualifiedName = this.FQNFunctions.getFQN(cls);
        logger.debug(`createFamixInheritance: classFullyQualifiedName: class fqn = ${classFullyQualifiedName}`);
        let subClass: Famix.Class | Famix.Interface;
        if (cls instanceof ClassDeclaration) {
            subClass = this.famixClassMap.get(classFullyQualifiedName);
        }
        else {
            subClass = this.famixInterfaceMap.get(classFullyQualifiedName);
        }
        
        let inhClassName: string;
        let inhClassFullyQualifiedName: string;
        let superClass: Famix.Class | Famix.Interface;
        if (inhClass instanceof ClassDeclaration || inhClass instanceof InterfaceDeclaration) {
            inhClassName = inhClass.getName();
            inhClassFullyQualifiedName = this.FQNFunctions.getFQN(inhClass);
            if (inhClass instanceof ClassDeclaration) {
                superClass = this.famixClassMap.get(inhClassFullyQualifiedName);
            }
            else {
                superClass = this.famixInterfaceMap.get(inhClassFullyQualifiedName);
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
                superClass = new Famix.Class(this.famixRep);
                this.famixClassMap.set(inhClassFullyQualifiedName, superClass);
            }
            else {
                superClass = new Famix.Interface(this.famixRep);
                this.famixInterfaceMap.set(inhClassFullyQualifiedName, superClass);
            }

            superClass.setName(inhClassName);
            superClass.setFullyQualifiedName(inhClassFullyQualifiedName);
            superClass.setIsStub(true);

            this.famixFunctionsIndex.makeFamixIndexFileAnchor(inhClass, superClass);
        }

        fmxInheritance.setSubclass(subClass);
        fmxInheritance.setSuperclass(superClass);

        this.famixFunctionsIndex.makeFamixIndexFileAnchor(null, fmxInheritance);
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
        const fmxImportClause = new Famix.ImportClause(this.famixRep);

        let importedEntity: Famix.NamedEntity;
        let importedEntityName: string;
        let pathName = "\"" + moduleSpecifierFilePath + "\".";
        // Named imports, e.g. import { ClassW } from "./complexExportModule";
        if (importDeclaration instanceof ImportDeclaration 
            && importElement instanceof ImportSpecifier) { 
            importedEntityName = importElement.getName();
            pathName = pathName + importedEntityName;
            if (isInExports) {
                importedEntity = this.getFamixEntityByFullyQualifiedName(pathName) as Famix.NamedEntity;
            }
            if (importedEntity === undefined) {
                importedEntity = new Famix.NamedEntity(this.famixRep);
                importedEntity.setName(importedEntityName);
                if (!isInExports) {
                    importedEntity.setIsStub(true);
                }
                this.famixFunctionsIndex.makeFamixIndexFileAnchor(importElement, importedEntity);
                importedEntity.setFullyQualifiedName(pathName);
            }
        }
        // handle import equals declarations, e.g. import ClassW = require("./complexExportModule");
        else if (importDeclaration instanceof ImportEqualsDeclaration) {
            importedEntityName = importDeclaration?.getName();
            pathName = pathName + importedEntityName;
            importedEntity = new Famix.NamedEntity(this.famixRep);
            importedEntity.setName(importedEntityName);
            this.famixFunctionsIndex.makeFamixIndexFileAnchor(importElement, importedEntity);
            importedEntity.setFullyQualifiedName(pathName);
        } else {  // default imports, e.g. import ClassW from "./complexExportModule";  
            importedEntityName = importElement.getText();
            pathName = pathName + (isDefaultExport ? "defaultExport" : "namespaceExport");
            importedEntity = new Famix.NamedEntity(this.famixRep);
            importedEntity.setName(importedEntityName);
            this.famixFunctionsIndex.makeFamixIndexFileAnchor(importElement, importedEntity);
            importedEntity.setFullyQualifiedName(pathName);
        }

        const importerFullyQualifiedName = this.FQNFunctions.getFQN(importer);
        const fmxImporter = this.getFamixEntityByFullyQualifiedName(importerFullyQualifiedName) as Famix.Module;
        fmxImportClause.setImportingEntity(fmxImporter);
        fmxImportClause.setImportedEntity(importedEntity);
        if (importDeclaration instanceof ImportEqualsDeclaration) {
            fmxImportClause.setModuleSpecifier(importDeclaration?.getModuleReference().getText() as string);
        } else {
            fmxImportClause.setModuleSpecifier(importDeclaration?.getModuleSpecifierValue() as string);
        }

        logger.debug(`createFamixImportClause: ${fmxImportClause.getImportedEntity()?.getName()} (of type ${
            getSubTypeName(fmxImportClause.getImportedEntity())}) is imported by ${fmxImportClause.getImportingEntity()?.getName()}`);

        // make an index file anchor for the import clause
        this.famixFunctionsIndex.makeFamixIndexFileAnchor(importDeclaration, fmxImportClause);

        fmxImporter.addOutgoingImport(fmxImportClause);
    }

    /**
     * Gets a Famix entity by id
     * @param famixId An id of a Famix entity
     * @returns The Famix entity corresponding to the id
     */
    private getFamixEntityById(famixId: number): Famix.Entity {
        return this.famixRep.getFamixEntityById(famixId) as Famix.Entity;
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
     * Finds the ancestor of a node
     * @param node A node
     * @returns The ancestor of the node
     */
    private findAncestor(node: Identifier): Node {
        return node.getAncestors().find(a => a.getKind() === SyntaxKind.MethodDeclaration || a.getKind() === SyntaxKind.Constructor || a.getKind() === SyntaxKind.FunctionDeclaration || a.getKind() === SyntaxKind.FunctionExpression || a.getKind() === SyntaxKind.ModuleDeclaration || a.getKind() === SyntaxKind.SourceFile || a.getKindName() === "GetAccessor" || a.getKindName() === "SetAccessor" || a.getKind() === SyntaxKind.ClassDeclaration);
    }
}
function getSubTypeName(fmxNamedEntity: Famix.NamedEntity) {
    const name = fmxNamedEntity instanceof Famix.Class ? 'Class' :
        fmxNamedEntity instanceof Famix.Interface ? 'Interface' :
            fmxNamedEntity instanceof Famix.Function ? 'Function' :
                fmxNamedEntity instanceof Famix.Enum ? 'Enum' :
                    fmxNamedEntity instanceof Famix.EnumValue ? 'EnumValue' :
                        fmxNamedEntity instanceof Famix.Alias ? 'Alias' :
                            fmxNamedEntity instanceof Famix.Variable ? 'Variable' :
                                fmxNamedEntity instanceof Famix.Type ? 'Type' :
                                    fmxNamedEntity instanceof Famix.Method ? 'Method' :
                                        fmxNamedEntity instanceof Famix.Decorator ? 'Decorator' :
                                            fmxNamedEntity instanceof Famix.Accessor ? 'Accessor' :
                                                fmxNamedEntity instanceof Famix.Parameter ? 'Parameter' :
                                                    fmxNamedEntity instanceof Famix.Property ? 'Property' :
                                                        'NamedEntity';
    console.log(`getSubTypeName: ${name}`);
    return name;
}

