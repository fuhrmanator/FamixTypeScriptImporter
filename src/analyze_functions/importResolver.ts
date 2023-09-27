import { ImportDeclaration, SourceFile } from "ts-morph";

// Initialize an empty map to store import resolutions
export const importResolutions: Record<string, { modulePath: string; importName: string }[]> = {};

// Create a custom resolver function
export function resolveImport(
    sourceFile: SourceFile,
    importDeclaration: ImportDeclaration | undefined,
    importName: string
) {
    if (!importDeclaration) {
        importResolutions[importName] = [];
        return;
    }

    // Check if it's a default import
    if (importDeclaration.getDefaultImport()) {
        const defaultImportIdentifier = importDeclaration.getDefaultImport();
        const fullyQualifiedName = defaultImportIdentifier.getText();
        const modulePath = importDeclaration.getModuleSpecifierSourceFile()!.getFilePath();
        if (!importResolutions[importName]) {
            importResolutions[importName] = [];
        }
        importResolutions[importName].push({ modulePath, importName: fullyQualifiedName });
        return;
    }

    // Check if it's a namespace import
    const namespaceImport = importDeclaration.getNamespaceImport();
    if (namespaceImport) {
        // For namespace imports, we assume that the imported name will be available on the namespace
        const fullyQualifiedName = namespaceImport.getText();
        const modulePath = importDeclaration.getModuleSpecifierSourceFile()!.getFilePath();
        if (!importResolutions[importName]) {
            importResolutions[importName] = [];
        }
        importResolutions[importName].push({ modulePath, importName: fullyQualifiedName });
        return;
    }

    // Check if it's a named import
    const namedImports = importDeclaration.getNamedImports();
    for (const namedImport of namedImports) {
        if (namedImport.getName() === importName) {
            const fullyQualifiedName = namedImport.getName();
            const modulePath = importDeclaration.getModuleSpecifierSourceFile()!.getFilePath();
            if (!importResolutions[importName]) {
                importResolutions[importName] = [];
            }
            importResolutions[importName].push({ modulePath, importName: fullyQualifiedName });
            return;
        }
    }
}
