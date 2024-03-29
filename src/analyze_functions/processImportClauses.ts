import { ImportDeclaration, SourceFile, ExportedDeclarations } from "ts-morph";
import * as FamixFunctions from "../famix_functions/famix_object_creator";
import { logger } from "../analyze";

/**
 * This class is used to build a Famix model for the import clauses
 */
export class ProcessImportClauses {

    /**
     * Builds a Famix model for the import clauses of the source files which are modules
     * @param modules An array of modules
     * @param exports An array of maps of exported declarations
     */
    public processImportClauses(modules: Array<SourceFile>, exports: Array<ReadonlyMap<string, ExportedDeclarations[]>>): void {
        logger.info(`processImportClauses: Creating import clauses:`);
        modules.forEach(module => {
            module.getImportDeclarations().forEach(impDecl => {
                const path = this.getModulePath(impDecl);

                impDecl.getNamedImports().forEach(namedImport => {
                    logger.debug(`processImportClauses: Importing (named) ${namedImport.getName()} from ${impDecl.getModuleSpecifierValue()}`);
                    const importedEntityName = namedImport.getName();
                    let importFoundInExports = false;
                    exports.forEach(e => {
                        if (e.has(importedEntityName)) {
                            importFoundInExports = true;
                        }
                    });
                    FamixFunctions.createFamixImportClause({importDeclaration: impDecl,
                        importer: module, 
                        moduleSpecifierFilePath: path, 
                        importElement: namedImport, 
                        isInExports: importFoundInExports, 
                        isDefaultExport: false});
                });

                const defaultImport = impDecl.getDefaultImport();
                if (defaultImport !== undefined) {
                    logger.debug(`processImportClauses: Importing (default) ${defaultImport.getText()} from ${impDecl.getModuleSpecifierValue()}`);
                    // call with module, impDecl.getModuleSpecifierValue(), path, defaultImport, false, true
                    FamixFunctions.createFamixImportClause({importDeclaration: impDecl,
                        importer: module,
                        moduleSpecifierFilePath: path,
                        importElement: defaultImport,
                        isInExports: false,
                        isDefaultExport: true});
                }

                const namespaceImport = impDecl.getNamespaceImport();
                if (namespaceImport !== undefined) {
                    logger.debug(`processImportClauses: Importing (namespace) ${namespaceImport.getText()} from ${impDecl.getModuleSpecifierValue()}`);
                    FamixFunctions.createFamixImportClause({importDeclaration: impDecl,
                        importer: module, 
                        moduleSpecifierFilePath: path, 
                        importElement: namespaceImport, 
                        isInExports: false, 
                        isDefaultExport: false});
                    // this.famixFunctions.createFamixImportClause(module, impDecl.getModuleSpecifierValue(), path, namespaceImport, false, false);
                }
            }); 
        });
    }

    /**
     * Gets the path of a module to be imported
     * @param i An import declaration
     * @returns The path of the module to be imported
     */
    private getModulePath(i: ImportDeclaration): string {
        let path: string;
        if (i.getModuleSpecifierSourceFile() === undefined) {
            if (i.getModuleSpecifierValue().substring(i.getModuleSpecifierValue().length - 3) === ".ts") {
                path = i.getModuleSpecifierValue();
            }
            else {
                path = i.getModuleSpecifierValue() + ".ts";
            }
        }
        else {
            path = i.getModuleSpecifierSourceFile().getFilePath();
        }
        return path;
    }
}
