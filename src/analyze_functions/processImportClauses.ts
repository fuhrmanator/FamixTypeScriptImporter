import { ImportDeclaration, SourceFile } from "ts-morph";
import { FamixFunctions } from "../famix_functions/famix_functions";
import { logger } from "../analyze";
import { resolveImport } from "./importResolver";

/**
 * This class is used to build a Famix model for the import clauses
 */
export class ProcessImportClauses {

    private famixFunctions: FamixFunctions; // FamixFunctions object, it contains all the functions needed to create Famix entities

    /**
     * Initializes the ProcessImportClauses object
     * @param famixFunctions FamixFunctions object, it contains all the functions needed to create Famix entities
     */
    constructor(famixFunctions: FamixFunctions) {
        this.famixFunctions = famixFunctions;
    }

    /**
     * Builds a Famix model for the import clauses of the source files which are modules
     * @param modules An array of modules
     * @param exports An array of maps of exported declarations
     */
    public processImportClauses(modules: Array<SourceFile>): void {
        logger.info(`Creating import clauses:`);
        modules.forEach(module => {
            logger.debug(`Processing module ${module.getFilePath()}`);
            module.getImportDeclarations().forEach(importDeclaration => {
                logger.debug(`Processing import declaration ${importDeclaration.getText()}`);

                const path = this.getModulePath(importDeclaration);

                logger.debug(`Importing from ${path}`);

                importDeclaration.getNamedImports().forEach(namedImport => {
                    logger.debug(`Importing (named) ${namedImport.getName()} from ${importDeclaration.getModuleSpecifierValue()}`);
                    const importedEntityName = namedImport.getName();

                    const resolution = resolveImport(module, importDeclaration, importedEntityName);

                    // what's an example of resolution?
                    // { exportModulePath: modulePath, importName: fullyQualifiedName };

                    // create a new object from the resolution and add other info
                    const importClauseInfo = {...resolution, 
                        importDeclaration: importDeclaration, 
                        importer: module, 
                        importElement: namedImport};

                    // what is the importClauseInfo object?
                    // { exportModulePath: modulePath, importName: fullyQualifiedName, importDeclaration: importDeclaration, importer: module, importElement: namedImport };
                    this.famixFunctions.createFamixImportClauseNew(importClauseInfo);

                    // define a new function createFamixImportClauseNew that takes the importClauseInfo object and creates the FamixImportClause object

                    // this.famixFunctions.createFamixImportClause({importDeclaration: importDeclaration,
                    //     importer: module, 
                    //     moduleSpecifierFilePath: path, 
                    //     importElement: namedImport, 
                    //     isInExports: importFoundInExports, 
                    //     isDefaultExport: false});
                });

                const defaultImport = importDeclaration.getDefaultImport();
                if (defaultImport !== undefined) {
                    logger.debug(`Importing (default) ${defaultImport.getText()} from ${importDeclaration.getModuleSpecifierValue()}`);
                    // call with module, impDecl.getModuleSpecifierValue(), path, defaultImport, false, true
                    this.famixFunctions.createFamixImportClause({importDeclaration: importDeclaration,
                        importer: module,
                        moduleSpecifierFilePath: path,
                        importElement: defaultImport,
                        isInExports: false,
                        isDefaultExport: true});
                }

                const namespaceImport = importDeclaration.getNamespaceImport();
                if (namespaceImport !== undefined) {
                    logger.debug(`Importing (namespace) ${namespaceImport.getText()} from ${importDeclaration.getModuleSpecifierValue()}`);
                    this.famixFunctions.createFamixImportClause({importDeclaration: importDeclaration,
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
        if (i.getModuleSpecifierSourceFile() === undefined) { // no source file, so it's a third-party module?
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
