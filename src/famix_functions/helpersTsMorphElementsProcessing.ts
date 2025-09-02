import { ArrowFunction, ClassDeclaration, ExportSpecifier, ExpressionWithTypeArguments, Identifier, ImportSpecifier, 
    InterfaceDeclaration, ModuleDeclaration, Node, SourceFile, SyntaxKind, ts } from "ts-morph";
import { Symbol as TSMorphSymbol } from "ts-morph";

/**
 * ts-morph doesn't find classes in arrow functions, so we need to find them manually
 * @param s A source file 
 * @returns the ClassDeclaration objects found in arrow functions of the source file
 */
export function getClassesDeclaredInArrowFunctions(s: SourceFile | ModuleDeclaration): ClassDeclaration[] {
    const arrowFunctions = s.getDescendantsOfKind(SyntaxKind.ArrowFunction);
    const classesInArrowFunctions = arrowFunctions.map(f => getArrowFunctionClasses(f)).flat();
    return classesInArrowFunctions;
}

    
export function getArrowFunctionClasses(f: ArrowFunction): ClassDeclaration[] {
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
 * Checks if the file has any imports or exports to be considered a module
 * @param sourceFile A source file
 * @returns A boolean indicating if the file is a module
 */
export function isSourceFileAModule(sourceFile: SourceFile): boolean {
    return sourceFile.getImportDeclarations().length > 0 || 
    sourceFile.getExportedDeclarations().size > 0 || 
    sourceFile.getExportDeclarations().length > 0 || 
    sourceFile.getDescendantsOfKind(SyntaxKind.ImportEqualsDeclaration).length > 0;
}

// NOTE: Finding the symbol may not work when used bare import without baseUrl
// e.g. import { MyInterface } from "outsideInterface"; will not work if baseUrl is not set
export function getInterfaceOrClassDeclarationFromExpression(expression: ExpressionWithTypeArguments): InterfaceDeclaration | ClassDeclaration | undefined {
    // Step 1: Get the type of the expression
    const type = expression.getType();

    // Step 2: Get the symbol associated with the type
    let symbol = type.getSymbol();

    if (!symbol) {
        // If symbol is not found, try to get the symbol from the identifier
        const identifier = expression.getFirstDescendantByKind(SyntaxKind.Identifier);
        if (!identifier) {
            throw new Error(`Identifier not found for ${expression.getText()}.`);
        }
        symbol = identifier.getSymbol();
        if (!symbol) {
            throw new Error(`Symbol not found for ${identifier.getText()}.`);
        }
    }

    // Step 3: Resolve the symbol to find the actual declaration
    const interfaceDeclaration = resolveSymbolToInterfaceOrClassDeclaration(symbol);

    if (!interfaceDeclaration) {
        // logger.error(`Interface declaration not found for ${expression.getText()}.`);
    }

    return interfaceDeclaration;
}

function resolveSymbolToInterfaceOrClassDeclaration(symbol: TSMorphSymbol): InterfaceDeclaration | ClassDeclaration | undefined {
    // Get the declarations associated with the symbol
    const declarations = symbol.getDeclarations();

    // Filter for InterfaceDeclaration or ClassDeclaration
    const interfaceOrClassDeclaration = declarations.find(
        declaration => 
            declaration instanceof InterfaceDeclaration || 
            declaration instanceof ClassDeclaration) as InterfaceDeclaration | ClassDeclaration | undefined;

    if (interfaceOrClassDeclaration) {
        return interfaceOrClassDeclaration;
    }

    // Handle imports: If the symbol is imported, resolve the import to find the actual declaration
    for (const declaration of declarations) {
        if (declaration.getKind() === SyntaxKind.ImportSpecifier) {
            const importSpecifier = declaration as ImportSpecifier;
            const importDeclaration = importSpecifier.getImportDeclaration();
            const moduleSpecifier = importDeclaration.getModuleSpecifierSourceFile();

            if (moduleSpecifier) {
                const exportedSymbols = moduleSpecifier.getExportSymbols();
                const exportedSymbol = exportedSymbols.find(symbol => symbol.getName() === importSpecifier.getName());
                if (exportedSymbol) {
                    return resolveSymbolToInterfaceOrClassDeclaration(exportedSymbol);
                }
            }
        }
    }
    return undefined;
}

export const getDeclarationFromImportOrExport = (importOrExport: ImportSpecifier | ExportSpecifier | Identifier): Node<ts.Node> | undefined => {
    const symbol = importOrExport.getSymbol();
    const aliasedSymbol = symbol?.getAliasedSymbol();

    return getDeclarationFromSymbol(aliasedSymbol);
};

export const getDeclarationFromSymbol = (symbol: TSMorphSymbol | undefined) => {
    let entityDeclaration = symbol?.getValueDeclaration();

    if (!entityDeclaration) {
        const declarations = symbol?.getDeclarations();
        if (declarations && declarations?.length > 0) {
            entityDeclaration = declarations[0];
        }
    }

    return entityDeclaration;
};