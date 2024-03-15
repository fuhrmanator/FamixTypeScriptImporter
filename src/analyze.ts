import { Project } from "ts-morph";
import * as fs from 'fs';
import { FamixRepository } from "./lib/famix/src/famix_repository";
import * as FamixFunctions from "./famix_functions/famix_object_creator";
import { ProcessFiles } from "./analyze_functions/processFiles";
import { ProcessAccesses } from "./analyze_functions/processAccesses";
import { ProcessInvocations } from "./analyze_functions/processInvocations";
import { ProcessInheritances } from "./analyze_functions/processInheritances";
import { ProcessImportClauses } from "./analyze_functions/processImportClauses";

import { Logger } from "tslog";

export const logger = new Logger({ name: "ts2famix", minLevel: 3});
export const config = { "expectGraphemes": false };

/**
 * This class is used to build a Famix model from a TypeScript source code
 */
export class Importer {

    private project = new Project(); // The project containing the source files to analyze
    private processFiles = new ProcessFiles(); // ProcessFiles object, it contains all the functions needed to process the source files
    private processAccesses = new ProcessAccesses(); // ProcessAccesses object, it contains all the functions needed to process the accesses
    private processInvocations = new ProcessInvocations(); // ProcessInvocations object, it contains all the functions needed to process the invocations
    private processInheritances = new ProcessInheritances(); // ProcessInheritances object, it contains all the functions needed to process the inheritances
    private processImportClauses = new ProcessImportClauses(); // ProcessImportClauses object, it contains all the functions needed to process the import clauses

    /**
     * Main method
     * @param paths An array of paths to the source files to analyze
     * @returns The Famix repository containing the Famix model
     */
    public famixRepFromPaths(paths: Array<string>): FamixRepository {

//        try {
        logger.debug(`famixRepFromPaths: paths: ${paths}`);
        this.project.addSourceFilesAtPaths(paths);
        this.processEntities(this.project);

        const famixRep = FamixFunctions.famixRep;
//        }
//        catch (error) {
            // logger.error(`> ERROR: got exception ${error}. Exiting...`);
            // logger.error(error.message);
            // logger.error(error.stack);
            // process.exit(1);
//        }

        return famixRep;
    }

    private processEntities(project) {
        this.processFiles.processFiles(project.getSourceFiles());
        const accesses = this.processFiles.getAccesses();
        const methodsAndFunctionsWithId = this.processFiles.getMethodsAndFunctionsWithId();
        const classes = this.processFiles.getClasses();
        const interfaces = this.processFiles.getInterfaces();
        const modules = this.processFiles.getModules();
        const exports = this.processFiles.getExports();

        this.processImportClauses.processImportClauses(modules, exports);
        this.processAccesses.processAccesses(accesses);
        this.processInvocations.processInvocations(methodsAndFunctionsWithId);
        this.processInheritances.processInheritances(classes, interfaces);
    }

    /**
     * Main method for tests
     *
     * @param filename The name of the file to analyze
     * @param source A TypeScript source code
     * @returns The Famix repository containing the Famix model
     */
    // TODO: this is slow because it writes the source code to a file and then reads it again - it's possible to just pass the source code to the ts-morph project
    public famixRepFromSource(filename: string, source: string): FamixRepository {
        const filePath = `./test_src/${filename}.ts`;

        fs.writeFileSync(filePath, source, 'utf-8');

        const famixRep = this.famixRepFromPaths([filePath]);

        return famixRep;
    }

    /**
     * Main method for a ts-morph project
     * @param project A ts-morph project
     * @returns The Famix repository containing the Famix model
     */
    public famixRepFromProject(project: Project): FamixRepository {
        //const sourceFileNames = project.getSourceFiles().map(f => f.getFilePath()) as Array<string>;

        //const famixRep = this.famixRepFromPaths(sourceFileNames);
        this.processEntities(project);

        return FamixFunctions.famixRep;
    }

}
