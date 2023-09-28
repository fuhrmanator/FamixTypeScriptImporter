import { ImportDeclaration, SourceFile } from "ts-morph";
import { logger } from "../analyze";

// Initialize an empty map to store import resolutions
export const importResolutions: Record<string, { exportModulePath: string; importName: string }[]> = {};

/**
 * Maps an import name to an export module path (stored in `importResolutions`)
 * @param importerSourceFile Source file that contains the import declaration
 * @param importDeclaration the import declaration to resolve
 * @param importName the name of the import to resolve
 */
export function resolveImport(
    importerSourceFile: SourceFile,
    importDeclaration: ImportDeclaration,
    importName: string
): void {

    const moduleSpecifier = importDeclaration.getModuleSpecifier();
    if (!moduleSpecifier) {
        throw new Error(`Could not find module specifier for "${importDeclaration.getText()}"`);
    }

    // Check if it's a default import
    if (importDeclaration.getDefaultImport()) {
        const defaultImportIdentifier = importDeclaration.getDefaultImport();
        const fullyQualifiedName = defaultImportIdentifier.getText();
        const modulePath = importDeclaration.getModuleSpecifierSourceFile()!.getFilePath();
        if (!importResolutions[importName]) {
            importResolutions[importName] = [];
        }
        importResolutions[importName].push({ exportModulePath: modulePath, importName: fullyQualifiedName });
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
        importResolutions[importName].push({ exportModulePath: modulePath, importName: fullyQualifiedName });
        return;
    }

    // Check if it's a named import (third-party falls into here)
    const namedImports = importDeclaration.getNamedImports();
    for (const namedImport of namedImports) {
        if (namedImport.getName() === importName) {
            const fullyQualifiedName = namedImport.getName();
            const getModuleSpecifierSourceFile = importDeclaration.getModuleSpecifierSourceFile();
            let modulePath = "";
            if (!getModuleSpecifierSourceFile) {
                // Assume it's a third-party module
                logger.debug(`Could not find module specifier source file for "${importDeclaration.getText()} with fqn of ${fullyQualifiedName}. Assuming third-party module"`);
                modulePath = importName;
            } else {
                modulePath = getModuleSpecifierSourceFile.getFilePath();
            }
            if (!importResolutions[importName]) {
                importResolutions[importName] = [];
            }
            importResolutions[importName].push({ exportModulePath: modulePath, importName: fullyQualifiedName });
            return;
        }
    }
}
