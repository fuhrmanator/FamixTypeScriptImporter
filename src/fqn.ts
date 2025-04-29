import { ArrowFunction, CallExpression, ClassDeclaration, ConstructorDeclaration, Decorator, EnumDeclaration, FunctionDeclaration, FunctionExpression, GetAccessorDeclaration, Identifier, ImportDeclaration, ImportEqualsDeclaration, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, Node, PropertyDeclaration, SetAccessorDeclaration, SourceFile, SyntaxKind, TypeParameterDeclaration, VariableDeclaration } from "ts-morph";
import { entityDictionary, logger } from "./analyze";
import path from "path";
import { TSMorphTypeDeclaration } from "./famix_functions/EntityDictionary";

type FQNNode = SourceFile | VariableDeclaration | ArrowFunction | Identifier | MethodDeclaration | MethodSignature | FunctionDeclaration | FunctionExpression | PropertyDeclaration | TSMorphTypeDeclaration | EnumDeclaration | ImportDeclaration | ImportEqualsDeclaration | CallExpression | GetAccessorDeclaration | SetAccessorDeclaration | ConstructorDeclaration | TypeParameterDeclaration | ClassDeclaration | InterfaceDeclaration | Decorator | ModuleDeclaration;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isFQNNode(node: Node): node is FQNNode {
    return Node.isVariableDeclaration(node) || Node.isArrowFunction(node) || Node.isIdentifier(node) || Node.isMethodDeclaration(node) || Node.isClassDeclaration(node) || Node.isClassExpression(node) || Node.isDecorator(node) || Node.isModuleDeclaration(node) || Node.isCallExpression(node);
}

/**
 * Builds a map of method positions to their property keys in object literals.
 * Scans all variable declarations in a source file, targeting object literals with any keys
 * (e.g., `3: { method() {} }` or `add: { compute() {} }`), and maps each method's start position to its key.
 * Logs each step for debugging.
 * 
 * @param sourceFile The TypeScript source file to analyze
 * @returns A Map where keys are method start positions and values are their property keys (e.g., "3", "add")
 */
function buildStageMethodMap(sourceFile: SourceFile): Map<number, string> {
    const stageMap = new Map<number, string>();

    sourceFile.getVariableDeclarations().forEach(varDecl => {
        const varName = varDecl.getName();
        const initializer = varDecl.getInitializer();

        if (!initializer || !Node.isObjectLiteralExpression(initializer)) {
            return;
        }

        initializer.getProperties().forEach(prop => {
            let key: string | undefined;

            if (Node.isPropertyAssignment(prop)) {
                const nameNode = prop.getNameNode();

                if (Node.isIdentifier(nameNode)) {
                    key = nameNode.getText();
                } else if (Node.isStringLiteral(nameNode)) {
                    key = nameNode.getText().replace(/^"(.+)"$/, '$1').replace(/^'(.+)'$/, '$1');
                } else if (Node.isNumericLiteral(nameNode)) {
                    key = nameNode.getText();
                } else if (Node.isComputedPropertyName(nameNode)) {
                    const expression = nameNode.getExpression();

                    if (Node.isIdentifier(expression)) {
                        // Resolve variable value if possible
                        const symbol = expression.getSymbol();
                        if (symbol) {
                            const decl = symbol.getDeclarations()[0];
                            if (Node.isVariableDeclaration(decl) && decl.getInitializer()) {
                                const init = decl.getInitializer()!;
                                if (Node.isStringLiteral(init) || Node.isNumericLiteral(init)) {
                                    key = init.getText().replace(/^"(.+)"$/, '$1').replace(/^'(.+)'$/, '$1');
                                }
                            }
                        }
                        if (!key) {
                            key = expression.getText();
                        }
                    } else if (Node.isBinaryExpression(expression) && expression.getOperatorToken().getText() === '+') {
                        // Handle simple string concatenation (e.g., "A" + "B")
                        const left = expression.getLeft();
                        const right = expression.getRight();
                        if (Node.isStringLiteral(left) && Node.isStringLiteral(right)) {
                            key = left.getLiteralText() + right.getLiteralText();
                        }
                    } else if (Node.isTemplateExpression(expression)) {
                        // Handle template literals (e.g., `key-${1}`)
                        const head = expression.getHead().getLiteralText();
                        const spans = expression.getTemplateSpans();
                        if (spans.length === 1 && Node.isNumericLiteral(spans[0].getExpression())) {
                            const num = spans[0].getExpression().getText();
                            key = `${head}${num}`;
                        }
                    }
                    if (!key) {
                        key = expression.getText(); // Fallback
                    }
                } else {
                    return;
                }

                const propInitializer = prop.getInitializer();
                if (propInitializer && Node.isObjectLiteralExpression(propInitializer)) {
                    propInitializer.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach(method => {
                        const methodName = method.getName();
                        const pos = method.getStart();
                        if (key) {
                            stageMap.set(pos, key);
                        }
                    });
                }
            }
        });
    });

    return stageMap;
}

/**
 * Builds a map of method positions to their index in class/interface declarations
 * @param sourceFile The TypeScript source file to analyze
 * @returns A Map where keys are method start positions and values are their positional index (1-based)
 */
function buildMethodPositionMap(sourceFile: SourceFile): Map<number, number> {
    const positionMap = new Map<number, number>();
    
    // Handle classes
    sourceFile.getClasses().forEach(classNode => {
        const methods = classNode.getMethods();
        const methodCounts = new Map<string, number>();
        
        methods.forEach(method => {
            const methodName = method.getName();
            const count = (methodCounts.get(methodName) || 0) + 1;
            methodCounts.set(methodName, count);
            
            positionMap.set(method.getStart(), count);
        });
    });
    
    // Handle interfaces
    sourceFile.getInterfaces().forEach(interfaceNode => {
        const methods = interfaceNode.getMethods();
        const methodCounts = new Map<string, number>();
        
        methods.forEach(method => {
            const methodName = method.getName();
            const count = (methodCounts.get(methodName) || 0) + 1;
            methodCounts.set(methodName, count);
            
            positionMap.set(method.getStart(), count);
        });
    });
    
    return positionMap;
}

/**
 * Generates a fully qualified name (FQN) for a given AST node.
 * Constructs an FQN by traversing the node's ancestry, adding names and keys
 * (numeric or string from object literals ...) as needed, prefixed with the file's relative path.
 * 
 * @param node The AST node to generate an FQN for
 * @returns A string representing the node's FQN (e.g., "{path}.operations.add.compute[MethodDeclaration]")
 */
export function getFQN(node: FQNNode | Node): string {
    const sourceFile = node.getSourceFile();
    const absolutePathProject = entityDictionary.famixRep.getAbsolutePath();
    const parts: string[] = [];
    let currentNode: Node | undefined = node;

    const stageMap = buildStageMethodMap(sourceFile);
    const methodPositionMap = buildMethodPositionMap(sourceFile);

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
            Node.isPropertyDeclaration(currentNode) ||
            Node.isParameterDeclaration(currentNode) ||
            Node.isDecorator(currentNode) ||
            Node.isTypeAliasDeclaration(currentNode) ||
            Node.isEnumDeclaration(currentNode) ||
            Node.isEnumMember(currentNode) ||
            Node.isParametered(currentNode) ||
            Node.isPropertySignature(currentNode) ||
            Node.isArrayLiteralExpression(currentNode) ||
            Node.isImportSpecifier(currentNode) ||
            Node.isIdentifier(currentNode)) {
            let name: string;
            if (Node.isImportSpecifier(currentNode)) {
                const alias = currentNode.getAliasNode()?.getText();
                if (alias) {
                    let importDecl: Node | undefined = currentNode;
                    while (importDecl && !Node.isImportDeclaration(importDecl)) {
                        importDecl = importDecl.getParent();
                    }
                    const moduleSpecifier = importDecl && Node.isImportDeclaration(importDecl) 
                        ? importDecl.getModuleSpecifier().getLiteralText() 
                        : "unknown";
                    name = currentNode.getName(); 
                    name = `${name} as ${alias}[ImportSpecifier<${moduleSpecifier}>]`;
                } else {
                    name = currentNode.getName(); 
                }
            } else {
                name = Node.isIdentifier(currentNode) ? currentNode.getText() 
                    : (currentNode as any).getName?.() || `Unnamed_${currentNode.getKindName()}(${lc})`;
            }

            if (Node.isMethodSignature(currentNode)) {
                const method = currentNode as MethodSignature;
                const params = method.getParameters().map(p => {
                    const typeText = p.getType().getText().replace(/\s+/g, "");
                    return typeText || "any"; // Fallback for untyped parameters
                });
                const returnType = method.getReturnType().getText().replace(/\s+/g, "") || "void";
                name = `${name}(${params.join(",")}):${returnType}`;
            }

            parts.unshift(name);

            if (Node.isMethodDeclaration(currentNode) || Node.isMethodSignature(currentNode)) {
                const key = stageMap.get(currentNode.getStart());
                if (key) {
                    parts.unshift(key);
                } else {
                    // Check if this is a method that needs positional index
                    const positionIndex = methodPositionMap.get(currentNode.getStart());
                    if (positionIndex && positionIndex > 1) {
                        // Only add position if it's not the first occurrence (backward compatibility)
                        parts.unshift(positionIndex.toString());
                    }
                }
            }
        } 
        else if (Node.isArrowFunction(currentNode) || 
                 Node.isBlock(currentNode) || 
                 Node.isForInStatement(currentNode) || 
                 Node.isForOfStatement(currentNode) || 
                 Node.isForStatement(currentNode) || 
                 Node.isCatchClause(currentNode)) {
            const name = `${currentNode.getKindName()}(${lc})`;
            parts.unshift(name);
        } 
        else if (Node.isConstructorDeclaration(currentNode)) {
            const name = "constructor";
            parts.unshift(name);
        } else {
            console.log(`Ignoring node kind: ${currentNode.getKindName()}`);
        }

        currentNode = currentNode.getParent();
    }

    let relativePath = entityDictionary.convertToRelativePath(
        path.normalize(sourceFile.getFilePath()), 
        absolutePathProject
    ).replace(/\\/g, "/");

    if (relativePath.includes("..")) {
        console.log(`Relative path contains ../: ${relativePath}`);
    }
    if (relativePath.startsWith("/")) {
        relativePath = relativePath.slice(1);
    }
    parts.unshift(`{${relativePath}}`);

    const fqn = parts.join(".") + `[${node.getKindName()}]`;
    return fqn;
}


export function getUniqueFQN(node: Node): string | undefined {
    const absolutePathProject = entityDictionary.famixRep.getAbsolutePath();
    const parts: string[] = [];

    if (node instanceof SourceFile) {
        return entityDictionary.convertToRelativePath(path.normalize(node.getFilePath()), absolutePathProject).replace(/\\/g, "/");
    }

    let currentNode: Node | undefined = node;
    while (currentNode) {
        if (Node.isSourceFile(currentNode)) {
            const relativePath = entityDictionary.convertToRelativePath(path.normalize(currentNode.getFilePath()), absolutePathProject).replace(/\\/g, "/");
            if (relativePath.includes("..")) {
                logger.error(`Relative path contains ../: ${relativePath}`);
            }
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
    let cKind: ClassDeclaration | undefined;
    let iKind: InterfaceDeclaration | undefined;
    let mKind: MethodDeclaration | undefined;
    let fKind: FunctionDeclaration | undefined; 
    let alias: TSMorphTypeDeclaration | undefined;
    switch (a.getKind()) {
        case SyntaxKind.SourceFile:
            return a.asKind(SyntaxKind.SourceFile)!.getBaseName();

        case SyntaxKind.ModuleDeclaration:
            return a.asKind(SyntaxKind.ModuleDeclaration)!.getName(); 

        case SyntaxKind.ClassDeclaration:
            cKind = a.asKind(SyntaxKind.ClassDeclaration);
            if (cKind && cKind.getTypeParameters().length > 0) {
                return cKind.getName() + getParameters(a);
            } else {
                return cKind?.getName() || "";
            }

        case SyntaxKind.InterfaceDeclaration:
            iKind = a.asKind(SyntaxKind.InterfaceDeclaration);
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
            mKind = a.asKind(SyntaxKind.MethodDeclaration);
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
            fKind = a.asKind(SyntaxKind.FunctionDeclaration);
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
            // special case for parameterized types
            alias = a.asKind(SyntaxKind.TypeAliasDeclaration);
            if (alias && alias.getTypeParameters().length > 0) {
                return alias.getName() + "<" + alias.getTypeParameters().map(tp => tp.getName()).join(", ") + ">";
            }
            return a.asKind(SyntaxKind.TypeAliasDeclaration)!.getName();

        case SyntaxKind.Constructor:
            return "constructor";   
        
        default:
            // throw new Error(`getNameOfNode called on a node that doesn't have a name: ${a.getKindName()}`);
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
