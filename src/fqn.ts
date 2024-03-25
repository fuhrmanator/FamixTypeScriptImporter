import * as ts from "ts-morph";
import * as FamixFunctions from "./famix_functions/famix_object_creator";

/**
 * Gets the fully qualified name of a node, if it has one
 * @param node A node
 * @returns The fully qualified name of the node, or undefined if it doesn't have one
 */
export function getFQN(node: ts.Node): string {
    const absolutePathProject = FamixFunctions.famixRep.getAbsolutePath();
    
    const path = require('path');

    if (node instanceof ts.SourceFile) {
        const absolutePath = path.normalize(node.getFilePath());

        const positionNodeModules = absolutePath.indexOf('node_modules');

        let pathInProject: string = absolutePath.replace(absolutePathProject, "");
        pathInProject = pathInProject.slice(1)

        return pathInProject;
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

    var pathInProject: string = "";

    if (positionNodeModules !== -1) {

        const pathFromNodeModules = absolutePath.substring(positionNodeModules);

        pathInProject = pathFromNodeModules
    } else {

        pathInProject = absolutePath.replace(absolutePathProject, "");

        pathInProject = pathInProject.slice(1);     
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
            return a.asKind(ts.SyntaxKind.ClassDeclaration)?.getName();

        case ts.SyntaxKind.InterfaceDeclaration:
            return a.asKind(ts.SyntaxKind.InterfaceDeclaration)?.getName();
                
        case ts.SyntaxKind.PropertyDeclaration:
            return a.asKind(ts.SyntaxKind.PropertyDeclaration)?.getName();    

        case ts.SyntaxKind.PropertySignature:
            return a.asKind(ts.SyntaxKind.PropertySignature)?.getName();    
    
        case ts.SyntaxKind.MethodDeclaration:
            return a.asKind(ts.SyntaxKind.MethodDeclaration)?.getName();

        case ts.SyntaxKind.MethodSignature:
            return a.asKind(ts.SyntaxKind.MethodSignature)?.getName();   

        case ts.SyntaxKind.GetAccessor:
            return a.asKind(ts.SyntaxKind.GetAccessor)?.getName();

        case ts.SyntaxKind.SetAccessor:
            return a.asKind(ts.SyntaxKind.SetAccessor)?.getName();
    
        case ts.SyntaxKind.FunctionDeclaration:
            return a.asKind(ts.SyntaxKind.FunctionDeclaration)?.getName();

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