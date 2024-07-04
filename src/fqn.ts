import * as ts from "ts-morph";
import { entityDictionary } from "./analyze";
import path from "path";

/**
 * Gets the fully qualified name of a node, if it has one
 * @param node A node
 * @returns The fully qualified name of the node, or undefined if it doesn't have one
 */
export function getFQN(node: ts.Node): string {
    const absolutePathProject = entityDictionary.famixRep.getAbsolutePath();
    
    if (node instanceof ts.SourceFile) {
        return entityDictionary.convertToRelativePath(path.normalize(node.getFilePath()), 
            absolutePathProject).replace(/\\/sg, "/");
    }

    const symbol = node.getSymbol();
    if (!symbol) {
        return undefined;
    }

    const declarations = symbol.getDeclarations();
    if (!declarations) {
        return undefined;
    }

    const sourceFile = declarations[0].getSourceFile();
    if (!sourceFile) {
        return undefined;
    }

    const absolutePath = path.normalize(sourceFile.getFilePath());
    const positionNodeModules = absolutePath.indexOf('node_modules');
    let pathInProject: string = "";

    if (positionNodeModules !== -1) {
        const pathFromNodeModules = absolutePath.substring(positionNodeModules);
        pathInProject = pathFromNodeModules;
    } else {
        pathInProject = entityDictionary.convertToRelativePath(absolutePath, absolutePathProject).replace(/\\/g, "/");     
    }

    const qualifiedNameParts: Array<string> = [];

    const nodeName = this.getNameOfNode(node);
    if (nodeName) qualifiedNameParts.push(nodeName);

    const ancestors = node.getAncestors();
    ancestors.forEach(a => {
        const partName = this.getNameOfNode(a);
        if (partName) qualifiedNameParts.push(partName);
    });

    qualifiedNameParts.pop();

    if (qualifiedNameParts.length > 0) {
        return `{${pathInProject}}.${qualifiedNameParts.reverse().join(".")}`;
    } 
    else {
        return undefined;
    }
}

/**
 * Gets the name of a node, if it has one
 * @param a A node
 * @returns The name of the node, or an empty string if it doesn't have one
 */
export function getNameOfNode(a: ts.Node<ts.ts.Node>): string {
    switch (a.getKind()) {
        case ts.SyntaxKind.SourceFile:
            return a.asKind(ts.SyntaxKind.SourceFile)?.getBaseName();

        case ts.SyntaxKind.ModuleDeclaration:
            return a.asKind(ts.SyntaxKind.ModuleDeclaration)?.getName(); 

        case ts.SyntaxKind.ClassDeclaration:
            if (a.asKind(ts.SyntaxKind.ClassDeclaration).getTypeParameters().length>0){
                return a.asKind(ts.SyntaxKind.ClassDeclaration)?.getName()+getParameters(a);
            } else {
                return a.asKind(ts.SyntaxKind.ClassDeclaration)?.getName();
            }

        case ts.SyntaxKind.InterfaceDeclaration:
            if (a.asKind(ts.SyntaxKind.InterfaceDeclaration).getTypeParameters().length>0){
                return a.asKind(ts.SyntaxKind.InterfaceDeclaration)?.getName()+getParameters(a);
            } else {
                return a.asKind(ts.SyntaxKind.InterfaceDeclaration)?.getName();
            }
                
        case ts.SyntaxKind.PropertyDeclaration:
            return a.asKind(ts.SyntaxKind.PropertyDeclaration)?.getName();    

        case ts.SyntaxKind.PropertySignature:
            return a.asKind(ts.SyntaxKind.PropertySignature)?.getName();    
    
        case ts.SyntaxKind.MethodDeclaration:
            if (a.asKind(ts.SyntaxKind.MethodDeclaration).getTypeParameters().length>0){
                return a.asKind(ts.SyntaxKind.MethodDeclaration)?.getName()+getParameters(a);
            } else {
                return a.asKind(ts.SyntaxKind.MethodDeclaration)?.getName();
            }

        case ts.SyntaxKind.MethodSignature:
            return a.asKind(ts.SyntaxKind.MethodSignature)?.getName();   

        case ts.SyntaxKind.GetAccessor:
            return a.asKind(ts.SyntaxKind.GetAccessor)?.getName();

        case ts.SyntaxKind.SetAccessor:
            return a.asKind(ts.SyntaxKind.SetAccessor)?.getName();
    
        case ts.SyntaxKind.FunctionDeclaration:
            if (a.asKind(ts.SyntaxKind.FunctionDeclaration).getTypeParameters().length>0){
                return a.asKind(ts.SyntaxKind.FunctionDeclaration)?.getName()+getParameters(a);
            } else {
                return a.asKind(ts.SyntaxKind.FunctionDeclaration)?.getName();
            }

        case ts.SyntaxKind.FunctionExpression:
            return (a.asKind(ts.SyntaxKind.FunctionExpression)?.getName()) ? a.asKind(ts.SyntaxKind.FunctionExpression)?.getName() : "anonymous";
            
        case ts.SyntaxKind.Parameter:
            return a.asKind(ts.SyntaxKind.Parameter)?.getName();
                
        case ts.SyntaxKind.VariableDeclaration:
            return a.asKind(ts.SyntaxKind.VariableDeclaration)?.getName();

        case ts.SyntaxKind.Decorator:
            return "@" + a.asKind(ts.SyntaxKind.Decorator)?.getName();    

        case ts.SyntaxKind.TypeParameter:
            return a.asKind(ts.SyntaxKind.TypeParameter)?.getName();

        case ts.SyntaxKind.EnumDeclaration:
            return a.asKind(ts.SyntaxKind.EnumDeclaration)?.getName();

        case ts.SyntaxKind.EnumMember:
            return a.asKind(ts.SyntaxKind.EnumMember)?.getName();

        case ts.SyntaxKind.TypeAliasDeclaration:
            return a.asKind(ts.SyntaxKind.TypeAliasDeclaration)?.getName();

        case ts.SyntaxKind.Constructor:
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
export function getParameters(a: ts.Node<ts.ts.Node>): string {
    switch (a.getKind()) {
        case ts.SyntaxKind.ClassDeclaration:    
            return "<" + a.asKind(ts.SyntaxKind.ClassDeclaration)?.getTypeParameters().map(tp => tp.getName()).join(", ") + ">";
        case ts.SyntaxKind.InterfaceDeclaration:
            return "<" + a.asKind(ts.SyntaxKind.InterfaceDeclaration)?.getTypeParameters().map(tp => tp.getName()).join(", ") + ">";
        case ts.SyntaxKind.MethodDeclaration:
            return "<" + a.asKind(ts.SyntaxKind.MethodDeclaration)?.getTypeParameters().map(tp => tp.getName()).join(", ") + ">";
        case ts.SyntaxKind.FunctionDeclaration:
            return "<" + a.asKind(ts.SyntaxKind.FunctionDeclaration)?.getTypeParameters().map(tp => tp.getName()).join(", ") + ">";
    }
}
