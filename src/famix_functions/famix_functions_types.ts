import { ConstructorDeclaration, FunctionDeclaration, MethodDeclaration, MethodSignature, PropertyDeclaration, PropertySignature, VariableDeclaration, ParameterDeclaration, GetAccessorDeclaration, SetAccessorDeclaration, EnumMember, TypeAliasDeclaration, Node, SyntaxKind, FunctionExpression } from "ts-morph";
import * as Famix from "../lib/famix/src/model/famix";
import { FamixRepository } from "../lib/famix/src/famix_repository";
import { FQNFunctions } from "../fqn";
import { FamixFunctionsIndex } from "./famix_functions_index";
import { logger } from "../analyze";

/**
 * This class is used to build a Famix model for the types
 */
export class FamixFunctionsTypes {

    private famixRep: FamixRepository; // The Famix repository
    private FQNFunctions = new FQNFunctions(); // The fully qualified name functions
    private fmxTypeMap = new Map<string, Famix.Type | Famix.PrimitiveType | Famix.ParameterizedType>(); // Maps the type names to their Famix model
    private famixFunctionsIndex: FamixFunctionsIndex; // FamixFunctionsIndex object, it contains all the functions needed to create Famix index file anchors

    /**
     * Initializes the FamixFunctionsIndex object
     * @param famixRep The Famix repository
     */
    constructor(famixRep: FamixRepository) {
        this.famixRep = famixRep;
        this.famixFunctionsIndex = new FamixFunctionsIndex(famixRep);
    }

    /**
     * Creates or gets a Famix type
     * @param typeName A type name
     * @param element A ts-morph element
     * @returns The Famix model of the type
     */
    public createOrGetFamixType(typeName: string, element: TypeAliasDeclaration | PropertyDeclaration | PropertySignature | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | EnumMember): Famix.Type | Famix.PrimitiveType | Famix.ParameterizedType {
        let fmxType: Famix.Type | Famix.PrimitiveType | Famix.ParameterizedType;
        let isPrimitiveType = false;
        let isParameterizedType = false;

        logger.debug("Creating (or getting) type: '" + typeName + "' of element: " + element?.getText() + " of kind: " + element?.getKindName());
        let ancestor: Famix.ContainerEntity;
        if (element !== undefined) {
            const typeAncestor = this.findTypeAncestor(element);
            const ancestorFullyQualifiedName = this.FQNFunctions.getFQN(typeAncestor);
            ancestor = this.getFamixEntityByFullyQualifiedName(ancestorFullyQualifiedName) as Famix.ContainerEntity;
            if (!ancestor) {
                throw new Error(`Ancestor ${ancestorFullyQualifiedName} not found.`);
            }
        }

        if (typeName === "number" || typeName === "string" || typeName === "boolean" || typeName === "bigint" || typeName === "symbol" || typeName === "undefined" || typeName === "null" || typeName === "any" || typeName === "unknown" || typeName === "never" || typeName === "void") {
            isPrimitiveType = true;
        }

        if(!isPrimitiveType && typeName.includes("<") && typeName.includes(">") && !(typeName.includes("=>"))) {
            isParameterizedType = true;
        }

        if (!this.fmxTypeMap.has(typeName)) {
            if (isPrimitiveType) {
                fmxType = new Famix.PrimitiveType(this.famixRep);
                fmxType.setIsStub(true);
            }
            else if (isParameterizedType) {
                fmxType = new Famix.ParameterizedType(this.famixRep);
                const parameterTypeNames = typeName.substring(typeName.indexOf("<") + 1, typeName.indexOf(">")).split(",").map(s => s.trim());
                const baseTypeName = typeName.substring(0, typeName.indexOf("<")).trim();
                parameterTypeNames.forEach(parameterTypeName => {
                    const fmxParameterType = this.createOrGetFamixType(parameterTypeName, element);
                    (fmxType as Famix.ParameterizedType).addArgument(fmxParameterType);
                });
                const fmxBaseType = this.createOrGetFamixType(baseTypeName, element);
                (fmxType as Famix.ParameterizedType).setBaseType(fmxBaseType);
            }
            else {
                fmxType = new Famix.Type(this.famixRep);
            }

            fmxType.setName(typeName);
            fmxType.setContainer(ancestor);
            
            this.famixFunctionsIndex.makeFamixIndexFileAnchor(element, fmxType);

            this.fmxTypeMap.set(typeName, fmxType);
        }
        else {
            fmxType = this.fmxTypeMap.get(typeName);
        }

        return fmxType;
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
     * Finds the ancestor of a ts-morph element
     * @param element A ts-morph element
     * @returns The ancestor of the ts-morph element
     */
    private findTypeAncestor(element: TypeAliasDeclaration | PropertyDeclaration | PropertySignature | MethodDeclaration | ConstructorDeclaration | MethodSignature | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression | ParameterDeclaration | VariableDeclaration | EnumMember): Node {
        return element.getAncestors().find(a => a.getKind() === SyntaxKind.MethodDeclaration || a.getKind() === SyntaxKind.Constructor || a.getKind() === SyntaxKind.MethodSignature || a.getKind() === SyntaxKind.FunctionDeclaration || a.getKind() === SyntaxKind.FunctionExpression || a.getKind() === SyntaxKind.ModuleDeclaration || a.getKind() === SyntaxKind.SourceFile || a.getKindName() === "GetAccessor" || a.getKindName() === "SetAccessor" || a.getKind() === SyntaxKind.ClassDeclaration || a.getKind() === SyntaxKind.InterfaceDeclaration);
    }
}
