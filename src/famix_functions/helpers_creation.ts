import * as Famix from "../lib/famix/src/model/famix";
import { logger } from "../analyze";
import { ConstructorDeclaration, Identifier, FunctionDeclaration, MethodDeclaration, MethodSignature, PropertyDeclaration, PropertySignature, VariableDeclaration, ParameterDeclaration, GetAccessorDeclaration, SetAccessorDeclaration, EnumMember, TypeAliasDeclaration, Node, SyntaxKind, FunctionExpression } from "ts-morph";
import { TypeDeclaration } from "./EntityDictionary";

interface SearchParameters {
    searchArray: string[];
    targetArray: string[];
    start?: number;
}

/**
 * This function works like indexOf, but it works with arrays of grapheme clusters.
 * @param targetArray
 */
export function indexOfSplitArray(params: SearchParameters): number {
    const {searchArray, targetArray, start = 0} = params;
    for (let i = start; i <= searchArray.length - targetArray.length; i++) {
        let found = true;
        for (let j = 0; j < targetArray.length; j++) {
            if (searchArray[i + j] !== targetArray[j]) {
                found = false;
                break;
            }
        }
        if (found) {
            return i; // Return the index where the target array was found
        }
    }
    return -1; // Return -1 if the target array was not found in the search array
}

export function getSubTypeName(fmxNamedEntity: Famix.NamedEntity) {
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
    logger.debug(`${fmxNamedEntity.getName()} is of type ${name}`);
    return name;
}

/**
 * Gets the signature of a method or a function
 * @param text A method or a function source code
 * @returns The signature of the method or the function
 */
export function computeSignature(text: string): string {
    const endSignatureText = text.indexOf("{");
    return text.substring(0, endSignatureText).trim();
}

/**
 * Finds the ancestor of a node
 * @param node A node
 * @returns The ancestor of the node
 */
export function findAncestor(node: Identifier): Node {
    return node.getAncestors().find(a => a.getKind() === SyntaxKind.MethodDeclaration || a.getKind() === SyntaxKind.Constructor || a.getKind() === SyntaxKind.FunctionDeclaration || a.getKind() === SyntaxKind.FunctionExpression || a.getKind() === SyntaxKind.ModuleDeclaration || a.getKind() === SyntaxKind.SourceFile || a.getKindName() === "GetAccessor" || a.getKindName() === "SetAccessor" || a.getKind() === SyntaxKind.ClassDeclaration);
}

/**
 * Finds the ancestor of a ts-morph element
 * @param element A ts-morph element
 * @returns The ancestor of the ts-morph element
 */
export function findTypeAncestor(element: TypeDeclaration): Node {
    return element.getAncestors().find(a => a.getKind() === SyntaxKind.MethodDeclaration || a.getKind() === SyntaxKind.Constructor || a.getKind() === SyntaxKind.MethodSignature || a.getKind() === SyntaxKind.FunctionDeclaration || a.getKind() === SyntaxKind.FunctionExpression || a.getKind() === SyntaxKind.ModuleDeclaration || a.getKind() === SyntaxKind.SourceFile || a.getKindName() === "GetAccessor" || a.getKindName() === "SetAccessor" || a.getKind() === SyntaxKind.ClassDeclaration || a.getKind() === SyntaxKind.InterfaceDeclaration);
}

export function arraysAreEqual(array1: string[], array2: string[]): boolean {
    if (array1 && array2 ) {
        return array1.length === array2.length && array1.every((value, index) => value === array2[index]);
    }
}

export function remplacerTypeGenerique(chaine: string, nouveauType: string): string {
    // Utiliser une expression régulière pour capturer le contenu entre '<' et '>'
    return chaine.replace(/<[^>]*>/, `<${nouveauType}>`);
}