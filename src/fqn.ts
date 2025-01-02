import { ArrowFunction, CallExpression, ClassDeclaration, ClassExpression, ConstructorDeclaration, Decorator, EnumDeclaration, FunctionDeclaration, FunctionExpression, GetAccessorDeclaration, Identifier, ImportDeclaration, ImportEqualsDeclaration, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, Node, PropertyDeclaration, SetAccessorDeclaration, SourceFile, SyntaxKind, TypeParameterDeclaration, VariableDeclaration } from "ts-morph";
import { entityDictionary, logger } from "./analyze";
import path from "path";
import { TypeDeclaration } from "./famix_functions/EntityDictionary";

type FQNNode = SourceFile | VariableDeclaration | ArrowFunction | Identifier | MethodDeclaration | MethodSignature | FunctionDeclaration | FunctionExpression | PropertyDeclaration | TypeDeclaration | EnumDeclaration | ImportDeclaration | ImportEqualsDeclaration | CallExpression | GetAccessorDeclaration | SetAccessorDeclaration | ConstructorDeclaration | TypeParameterDeclaration | ClassDeclaration | InterfaceDeclaration | Decorator | ModuleDeclaration;

function isFQNNode(node: Node): node is FQNNode {
    return Node.isVariableDeclaration(node) || Node.isArrowFunction(node) || Node.isIdentifier(node) || Node.isMethodDeclaration(node) || Node.isClassDeclaration(node) || Node.isClassExpression(node) || Node.isDecorator(node) || Node.isModuleDeclaration(node) || Node.isCallExpression(node);

}

export function getFQN(node: FQNNode | Node): string {
    const absolutePathProject = entityDictionary.famixRep.getAbsolutePath();

    const sourceFile = node.getSourceFile();
    let parts: string[] = [];
    let currentNode: Node | undefined = node;

    while (currentNode && !Node.isSourceFile(currentNode)) {
        const { line, column } = sourceFile.getLineAndColumnAtPos(currentNode.getStart());
        const lc = `${line}:${column}`;
        if (Node.isClassDeclaration(currentNode) || 
            Node.isClassExpression(currentNode) || 
            Node.isInterfaceDeclaration(currentNode) ||
            Node.isFunctionDeclaration(currentNode) || 
            Node.isMethodDeclaration(currentNode) || 
            Node.isModuleDeclaration(currentNode) || 
            Node.isVariableDeclaration(currentNode) || 
            Node.isGetAccessorDeclaration(currentNode) ||
            Node.isSetAccessorDeclaration(currentNode) ||
            Node.isTypeParameterDeclaration(currentNode) ||
            Node.isIdentifier(currentNode)) {
            let name = Node.isIdentifier(currentNode) ? currentNode.getText() 
                : getNameOfNode(currentNode) /* currentNode.getName() */ || 'Unnamed_' + currentNode.getKindName() + `(${lc})`;
            parts.unshift(name);
        } else if (Node.isArrowFunction(currentNode) || 
                   Node.isBlock(currentNode) || 
                   Node.isForInStatement(currentNode) || 
                   Node.isForOfStatement(currentNode) || 
                   Node.isForStatement(currentNode) || 
                   Node.isCatchClause(currentNode)) {
            parts.unshift(`${currentNode.getKindName()}(${lc})`);
        } else if (Node.isConstructorDeclaration(currentNode)) {
            parts.unshift(`constructor`);
        } else {
            // For other kinds, you might want to handle them specifically or ignore
            //console.log(`Ignoring node kind: ${currentNode.getKindName()}`);
        }
        currentNode = currentNode.getParent();
    }



    // Prepend the relative path of the source file
    const relativePath = entityDictionary.convertToRelativePath(
        path.normalize(sourceFile.getFilePath()), 
                       absolutePathProject).replace(/\\/sg, "/");
    parts.unshift(`{${relativePath}}`);
    const fqn = parts.join(".") + `[${node.getKindName()}]`;  // disambiguate

    logger.debug(fqn);
    return fqn;
}


export function getUniqueFQN(node: Node): string | undefined {
    const absolutePathProject = entityDictionary.famixRep.getAbsolutePath();
    let parts: string[] = [];

    if (node instanceof SourceFile) {
        return entityDictionary.convertToRelativePath(path.normalize(node.getFilePath()), absolutePathProject).replace(/\\/g, "/");
    }

    let currentNode: Node | undefined = node;
    while (currentNode) {
        if (Node.isSourceFile(currentNode)) {
            const relativePath = entityDictionary.convertToRelativePath(path.normalize(currentNode.getFilePath()), absolutePathProject).replace(/\\/g, "/");
            parts.unshift(relativePath); // Add file path at the start
            break;
        } else if (currentNode.getSymbol()) {
            const name = currentNode.getSymbol()!.getName();
            // For anonymous nodes, use kind and position as unique identifiers
            const identifier = name !== "__computed" ? name : `${currentNode.getKindName()}_${currentNode.getStartLinePos()}`;
            parts.unshift(identifier);
        }
        currentNode = currentNode.getParent();
    }

    return parts.join("::");
}

/**
 * Gets the name of a node, if it has one
 * @param a A node
 * @returns The name of the node, or an empty string if it doesn't have one
 */
export function getNameOfNode(a: Node): string {
    switch (a.getKind()) {
        case SyntaxKind.SourceFile:
            return a.asKind(SyntaxKind.SourceFile)!.getBaseName();

        case SyntaxKind.ModuleDeclaration:
            return a.asKind(SyntaxKind.ModuleDeclaration)!.getName(); 

        case SyntaxKind.ClassDeclaration:
            const cKind = a.asKind(SyntaxKind.ClassDeclaration);
            if (cKind && cKind.getTypeParameters().length > 0) {
                return cKind.getName() + getParameters(a);
            } else {
                return cKind?.getName() || "";
            }

        case SyntaxKind.InterfaceDeclaration:
            const iKind = a.asKind(SyntaxKind.InterfaceDeclaration);
            if (iKind && iKind.getTypeParameters().length > 0) {
                return iKind.getName() + getParameters(a);
            } else {
                return iKind?.getName() || "";
            }
                
        case SyntaxKind.PropertyDeclaration:
            return a.asKind(SyntaxKind.PropertyDeclaration)!.getName();    

        case SyntaxKind.PropertySignature:
            return a.asKind(SyntaxKind.PropertySignature)!.getName();    
    
        case SyntaxKind.MethodDeclaration:
            const mKind = a.asKind(SyntaxKind.MethodDeclaration);
            if (mKind && mKind.getTypeParameters().length > 0) {
                return mKind.getName() + getParameters(a);
            } else {
                return mKind?.getName() || "";
            }

        case SyntaxKind.MethodSignature:
            return a.asKind(SyntaxKind.MethodSignature)!.getName();   

        case SyntaxKind.GetAccessor:
            return a.asKind(SyntaxKind.GetAccessor)!.getName();

        case SyntaxKind.SetAccessor:
            return a.asKind(SyntaxKind.SetAccessor)!.getName();
    
        case SyntaxKind.FunctionDeclaration:
            const fKind = a.asKind(SyntaxKind.FunctionDeclaration);
            if (fKind && fKind.getTypeParameters().length > 0) {
                return fKind.getName() + getParameters(a);
            } else {
                return fKind?.getName() || "";
            }

        case SyntaxKind.FunctionExpression:
            return a.asKind(SyntaxKind.FunctionExpression)?.getName() || "anonymous";
            
        case SyntaxKind.Parameter:
            return a.asKind(SyntaxKind.Parameter)!.getName();
                
        case SyntaxKind.VariableDeclaration:
            return a.asKind(SyntaxKind.VariableDeclaration)!.getName();

        case SyntaxKind.Decorator:
            return "@" + a.asKind(SyntaxKind.Decorator)!.getName();    

        case SyntaxKind.TypeParameter:
            return a.asKind(SyntaxKind.TypeParameter)!.getName();

        case SyntaxKind.EnumDeclaration:
            return a.asKind(SyntaxKind.EnumDeclaration)!.getName();

        case SyntaxKind.EnumMember:
            return a.asKind(SyntaxKind.EnumMember)!.getName();

        case SyntaxKind.TypeAliasDeclaration:
            return a.asKind(SyntaxKind.TypeAliasDeclaration)!.getName();

        case SyntaxKind.Constructor:
            return "constructor";   
            
        default:
            // ancestor hasn't got a useful name
            return "";
        }
}

/**
 * Gets the name of a node, if it has one
 * @param a A node
 * @returns The name of the node, or an empty string if it doesn't have one
 */
export function getParameters(a: Node): string {
    let paramString = "";
    switch (a.getKind()) {
        case SyntaxKind.ClassDeclaration:
            paramString = "<" + a.asKind(SyntaxKind.ClassDeclaration)?.getTypeParameters().map(tp => tp.getName()).join(", ") + ">";
            break;
        case SyntaxKind.InterfaceDeclaration:
            paramString = "<" + a.asKind(SyntaxKind.InterfaceDeclaration)?.getTypeParameters().map(tp => tp.getName()).join(", ") + ">";
            break;
        case SyntaxKind.MethodDeclaration:
            paramString = "<" + a.asKind(SyntaxKind.MethodDeclaration)?.getTypeParameters().map(tp => tp.getName()).join(", ") + ">";
            break;
        case SyntaxKind.FunctionDeclaration:
            paramString = "<" + a.asKind(SyntaxKind.FunctionDeclaration)?.getTypeParameters().map(tp => tp.getName()).join(", ") + ">";
            break;
        default:
            throw new Error(`getParameters called on a node that doesn't have parameters: ${a.getKindName()}`);
    }
    return paramString;
}
