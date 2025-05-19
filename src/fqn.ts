import { ArrowFunction, CallExpression, ClassDeclaration, ConstructorDeclaration, Decorator, EnumDeclaration, ExpressionWithTypeArguments, FunctionDeclaration, FunctionExpression, GetAccessorDeclaration, Identifier, ImportDeclaration, ImportEqualsDeclaration, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, Node, PropertyDeclaration, SetAccessorDeclaration, SourceFile, SyntaxKind, TypeParameterDeclaration, VariableDeclaration } from "ts-morph";
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
        // const varName = varDecl.getName();
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
                        // const methodName = method.getName();
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
 * Builds a map of method positions to their index in class/interface/namespace declarations
 * @param sourceFile The TypeScript source file to analyze
 * @returns A Map where keys are method start positions and values are their positional index (1-based)
 */
export function buildMethodPositionMap(sourceFile: SourceFile): Map<number, number> {
    const positionMap = new Map<number, number>();
    // console.log(`[buildMethodPositionMap] Starting analysis for file: ${sourceFile.getFilePath()}`);

    // Helper function to process modules recursively
    function processModule(moduleNode: ModuleDeclaration, modulePath: string) {
        // console.log(`[buildMethodPositionMap] Processing module: ${modulePath}`);

        // Track nested modules
        const nestedModuleCounts = new Map<string, number>(); // Track only nested modules
        const nestedModules = moduleNode.getModules();
        nestedModules.forEach(nestedModule => {
            if (Node.isModuleDeclaration(nestedModule)) {
                const nestedModuleName = nestedModule.getName();
                const count = (nestedModuleCounts.get(nestedModuleName) || 0) + 1;
                nestedModuleCounts.set(nestedModuleName, count);
                if (count > 1) { // Only set index for second and subsequent nested modules
                    positionMap.set(nestedModule.getStart(), count);
                    // console.log(`[buildMethodPositionMap] Nested module: ${nestedModuleName}, position: ${nestedModule.getStart()}, index: ${count}`);
                } else {
                    // console.log(`[buildMethodPositionMap] Nested module: ${nestedModuleName}, position: ${nestedModule.getStart()}, no index assigned (first occurrence)`);
                }
                const newModulePath = `${modulePath}.${nestedModuleName}`;
                processModule(nestedModule, newModulePath);
            }
        });

        // Handle functions directly in the module
        const functions = moduleNode.getFunctions();
        const functionCounts = new Map<string, number>();

        functions.forEach(func => {
            const funcName = func.getName() || `Unnamed_Function(${func.getStart()})`;
            const count = (functionCounts.get(funcName) || 0) + 1;
            functionCounts.set(funcName, count);
            positionMap.set(func.getStart(), count);
            // console.log(`[buildMethodPositionMap] Module function: ${funcName}, position: ${func.getStart()}, index: ${count}`);
        });

        // Handle classes within the module
        const classes = moduleNode.getClasses();
        classes.forEach(classNode => {
            // console.log(`[buildMethodPositionMap] Processing class in module: ${classNode.getName() || 'Unnamed'}`);
            const methods = classNode.getMethods();
            const methodCounts = new Map<string, number>();

            methods.forEach(method => {
                const methodName = method.getName();
                const count = (methodCounts.get(methodName) || 0) + 1;
                methodCounts.set(methodName, count);
                positionMap.set(method.getStart(), count);
                // console.log(`[buildMethodPositionMap] Module class method: ${methodName}, position: ${method.getStart()}, index: ${count}`);
            });
        });

        // Handle interfaces within the module
        const interfaces = moduleNode.getInterfaces();
        interfaces.forEach(interfaceNode => {
            // console.log(`[buildMethodPositionMap] Processing interface in module: ${interfaceNode.getName() || 'Unnamed'}`);
            const methods = interfaceNode.getMethods();
            const methodCounts = new Map<string, number>();

            methods.forEach(method => {
                const methodName = method.getName();
                const count = (methodCounts.get(methodName) || 0) + 1;
                methodCounts.set(methodName, count);
                positionMap.set(method.getStart(), count);
                // console.log(`[buildMethodPositionMap] Module interface method: ${methodName}, position: ${method.getStart()}, index: ${count}`);
            });
        });
    }

    function trackArrowFunctions(container: Node) {
        const arrows = container.getDescendantsOfKind(SyntaxKind.ArrowFunction);
        const functionExpressions = container.getDescendantsOfKind(SyntaxKind.FunctionExpression);
        let funcIndex = 0; // Start at 0, increment before assigning
        
        // Process Arrow Functions
        arrows.forEach(arrow => {
            const parent = arrow.getParent();
            // Allow arrow functions in blocks, source files, or call expressions (e.g., D3.js each)
            if (Node.isBlock(parent) || Node.isSourceFile(parent) || Node.isCallExpression(parent)) {
                funcIndex++; // Increment to get 1, 2, 3, ...
                positionMap.set(arrow.getStart(), funcIndex); // Use positive indices for arrow functions
                const { line, column } = sourceFile.getLineAndColumnAtPos(arrow.getStart());
                // console.log(`[buildMethodPositionMap] Arrow function at ${arrow.getStart()} (line: ${line}, col: ${column}), parent: ${parent.getKindName()}, index: ${funcIndex}`);
            } else {
                const { line, column } = sourceFile.getLineAndColumnAtPos(arrow.getStart());
                // console.log(`[buildMethodPositionMap] Skipping arrow function at ${arrow.getStart()} (line: ${line}, col: ${column}), parent: ${parent.getKindName()}`);
            }
        });

        // Process Function Expressions
        functionExpressions.forEach(funcExpr => {
            const parent = funcExpr.getParent();
            // Allow function expressions in blocks, source files, or call expressions
            if (Node.isBlock(parent) || Node.isSourceFile(parent) || Node.isCallExpression(parent)) {
                funcIndex++; // Increment to get next index
                positionMap.set(funcExpr.getStart(), funcIndex); // Use positive indices for function expressions
                const { line, column } = sourceFile.getLineAndColumnAtPos(funcExpr.getStart());
                // console.log(`[buildMethodPositionMap] Function expression at ${funcExpr.getStart()} (line: ${line}, col: ${column}), parent: ${parent.getKindName()}, index: ${funcIndex}`);
            } else {
                const { line, column } = sourceFile.getLineAndColumnAtPos(funcExpr.getStart());
                // console.log(`[buildMethodPositionMap] Skipping function expression at ${funcExpr.getStart()} (line: ${line}, col: ${column}), parent: ${parent.getKindName()}`);
            }
        });
    }

    // Handle top-level classes
    sourceFile.getClasses().forEach(classNode => {
        // console.log(`[buildMethodPositionMap] Processing class: ${classNode.getName() || 'Unnamed'}`);
        const methods = classNode.getMethods();
        const methodCounts = new Map<string, number>();

        methods.forEach(method => {
            const methodName = method.getName();
            const count = (methodCounts.get(methodName) || 0) + 1;
            methodCounts.set(methodName, count);
            positionMap.set(method.getStart(), count);
            // console.log(`[buildMethodPositionMap] Class method: ${methodName}, position: ${method.getStart()}, index: ${count}`);
        });

        methods.forEach(method => trackArrowFunctions(method));
    });
    
    // Handle top-level functions
    const topLevelFunctionCounts = new Map<string, number>();
    sourceFile.getFunctions().forEach(func => {
        const funcName = func.getName() || `Unnamed_Function(${func.getStart()})`;
        const count = (topLevelFunctionCounts.get(funcName) || 0) + 1;
        topLevelFunctionCounts.set(funcName, count);
        positionMap.set(func.getStart(), count);
        // console.log(`[buildMethodPositionMap] Top-level function: ${funcName}, position: ${func.getStart()}, index: ${count}`);
        trackArrowFunctions(func);
    });

    // Handle top-level interfaces
    sourceFile.getInterfaces().forEach(interfaceNode => {
        // console.log(`[buildMethodPositionMap] Processing interface: ${interfaceNode.getName() || 'Unnamed'}`);
        const methods = interfaceNode.getMethods();
        const methodCounts = new Map<string, number>();

        methods.forEach(method => {
            const methodName = method.getName();
            const count = (methodCounts.get(methodName) || 0) + 1;
            methodCounts.set(methodName, count);
            positionMap.set(method.getStart(), count);
            // console.log(`[buildMethodPositionMap] Interface method: ${methodName}, position: ${method.getStart()}, index: ${count}`);
        });
        methods.forEach(method => trackArrowFunctions(method));
    });

    // Handle top-level namespaces/modules
    const topLevelModuleCounts = new Map<string, number>(); // Track top-level modules
    sourceFile.getModules().forEach(moduleNode => {
        if (Node.isModuleDeclaration(moduleNode)) {
            const moduleName = moduleNode.getName();
            const count = (topLevelModuleCounts.get(moduleName) || 0) + 1;
            topLevelModuleCounts.set(moduleName, count);
            if (count > 1) { // Only set index for second and subsequent top-level modules
                positionMap.set(moduleNode.getStart(), count);
                // console.log(`[buildMethodPositionMap] Top-level module: ${moduleName}, position: ${moduleNode.getStart()}, index: ${count}`);
            } else {
                // console.log(`[buildMethodPositionMap] Top-level module: ${moduleName}, position: ${moduleNode.getStart()}, no index assigned (first occurrence)`);
            }
            processModule(moduleNode, moduleName);
        }
    });

    // Handle top-level arrow functions and function expressions
    trackArrowFunctions(sourceFile);

    // console.log(`[buildMethodPositionMap] Final positionMap:`, Array.from(positionMap.entries()));
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
                // if constructor, use "constructor" as name
                if (Node.isConstructorDeclaration(currentNode)) {
                    name = "constructor";
                } else {
                    name = Node.isIdentifier(currentNode) ? currentNode.getText()
                        : 'getName' in currentNode && typeof currentNode['getName'] === 'function'
                            ? ((currentNode as { getName(): string }).getName() +
                                ((Node.isClassDeclaration(currentNode) ||
                                    Node.isInterfaceDeclaration(currentNode) ||
                                    Node.isMethodDeclaration(currentNode) ||
                                    Node.isFunctionDeclaration(currentNode)) &&
                                    'getTypeParameters' in currentNode &&
                                    currentNode.getTypeParameters().length > 0
                                    ? getParameters(currentNode)
                                    : ''))
                            : `Unnamed_${currentNode.getKindName()}(${lc})`;
                }
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

            // Apply positional index for MethodDeclaration, MethodSignature, FunctionDeclaration, and FunctionExpression
            if (Node.isMethodDeclaration(currentNode) || 
                Node.isMethodSignature(currentNode) || 
                Node.isFunctionDeclaration(currentNode) ||
                Node.isFunctionExpression(currentNode)) {
                const key = stageMap.get(currentNode.getStart());
                if (key) {
                    parts.unshift(key);
                    // console.log(`[getFQN] Applied stageMap key: ${key} for ${currentNode.getKindName()} at position ${currentNode.getStart()}`);
                } else {
                    const positionIndex = methodPositionMap.get(currentNode.getStart());
                    if (positionIndex && positionIndex > 1) {
                        parts.unshift(positionIndex.toString());
                        // console.log(`[getFQN] Applied positionIndex: ${positionIndex} for ${currentNode.getKindName()} at position ${currentNode.getStart()}`);
                    } else {
                        // console.log(`[getFQN] No positionIndex applied for ${currentNode.getKindName()} at position ${currentNode.getStart()}, positionIndex: ${positionIndex || 'none'}`);
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
            // Apply funcIndex for ArrowFunction
            if (Node.isArrowFunction(currentNode)) {
                const funcIndex = methodPositionMap.get(currentNode.getStart());
                if (funcIndex && funcIndex > 0) {
                    parts.unshift(funcIndex.toString());
                    // console.log(`[getFQN] Applied funcIndex: ${funcIndex} for ArrowFunction at position ${currentNode.getStart()}`);
                }
            }
        } 
        else if (Node.isTypeParameterDeclaration(currentNode)) {
            const arrowParent = currentNode.getFirstAncestorByKind(SyntaxKind.ArrowFunction);
            if (arrowParent) {
                const arrowIndex = Math.abs(methodPositionMap.get(arrowParent.getStart()) || 0);
                if (arrowIndex > 0) {
                    parts.unshift(arrowIndex.toString());
                }
            }
            parts.unshift(currentNode.getName());
            // Removed continue to allow ancestor processing
        }
        else if (Node.isConstructorDeclaration(currentNode)) {
            const name = "constructor";
            parts.unshift(name);
        } else {
            // console.log(`[getFQN] Ignoring node kind: ${currentNode.getKindName()}`);
        }

        currentNode = currentNode.getParent();
    }

    let relativePath = entityDictionary.convertToRelativePath(
        path.normalize(sourceFile.getFilePath()),
        absolutePathProject
    ).replace(/\\/g, "/");

    if (relativePath.startsWith("/")) {
        relativePath = relativePath.slice(1);
    }
    parts.unshift(`{${relativePath}}`);

    const fqn = parts.join(".") + `[${node.getKindName()}]`;
    // console.log(`[getFQN] Final FQN: ${fqn}`);
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

/**
 * Gets the FQN of an unresolved interface that is being implemented or extended
 * @param unresolvedInheritedClassOrInterface The expression with type arguments representing the interface
 * @returns The FQN of the unresolved interface
 */
export function getFQNUnresolvedInheritedClassOrInterface(unresolvedInheritedClassOrInterface: ExpressionWithTypeArguments): string {
    // Check for either ClassDeclaration or InterfaceDeclaration ancestor
    const classAncestor = unresolvedInheritedClassOrInterface.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
    const interfaceAncestor = unresolvedInheritedClassOrInterface.getFirstAncestorByKind(SyntaxKind.InterfaceDeclaration);

    // Validate the context
    if (!classAncestor && !interfaceAncestor) {
        throw new Error("getFQNUnresolvedClassOrInterface called on a node that is not in an implements or extends context");
    }

    // Check if it's a valid implements/extends context
    let isValidContext = false;

    let classExtendsClass = false;

    if (classAncestor) {
        // check if the class is extending or implementing an interface
        const extendsClause = classAncestor.getExtends();
        const implementsClause = classAncestor.getImplements();
        isValidContext = (extendsClause !== undefined) || (implementsClause && implementsClause.length > 0);
        classExtendsClass = extendsClause !== undefined;
    } else if (interfaceAncestor) {
        // Check extends clause for interfaces
        const extendsClause = interfaceAncestor.getExtends();
        isValidContext = extendsClause && extendsClause.length > 0;
    }

    if (!isValidContext) {
        throw new Error("getFQNUnresolvedInterface called on a node that is not in a valid implements or extends context");
    }

    // get the name of the interface
    const name = unresolvedInheritedClassOrInterface.getExpression().getText();

    // Find where it's imported - search the entire source file
    const sourceFile = unresolvedInheritedClassOrInterface.getSourceFile();
    const importDecls = sourceFile.getImportDeclarations();

    for (const importDecl of importDecls) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const importClause = importDecl.getImportClause();

        if (importClause) {
            const namedImports = importClause.getNamedImports();
            // declarationName is ClassDeclaration if "class extends class"
            const declarationName = classExtendsClass ? "ClassDeclaration" : "InterfaceDeclaration";

            for (const namedImport of namedImports) {
                if (namedImport.getName() === name) {
                    logger.debug(`Found import for ${name} in ${moduleSpecifier}`);
                    return `{module:${moduleSpecifier}}.${name}[${declarationName}]`;
                }
            }
        }
    }

    // If not found, return a default FQN format
    return `{unknown-module}.${name}[InterfaceDeclaration]`;
}

