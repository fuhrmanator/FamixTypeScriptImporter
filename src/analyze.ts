import { Project } from "ts-morph";
import * as fs from 'fs';
import { FamixRepository } from "./lib/famix/famix_repository";
import { Logger } from "tslog";
import * as processFunctions from "./analyze_functions/process_functions";
import { EntityDictionary } from "./famix_functions/EntityDictionary";
import path from "path";

export const logger = new Logger({ name: "ts2famix", minLevel: 2 });
export const config = { "expectGraphemes": false };
export const entityDictionary = new EntityDictionary();

/**
 * This class is used to build a Famix model from a TypeScript source code
 */
export class Importer {

    private project = new Project(
        {
            compilerOptions: {
                baseUrl: "./test_src"
            }
        }
    ); // The project containing the source files to analyze

    /**
     * Main method
     * @param paths An array of paths to the source files to analyze
     * @returns The Famix repository containing the Famix model
     */
    public famixRepFromPaths(paths: Array<string>): FamixRepository {

        //        try {
        logger.debug(`famixRepFromPaths: paths: ${paths}`);

        this.project.addSourceFilesAtPaths(paths);

        initFamixRep(this.project);

        this.processEntities(this.project);

        const famixRep = entityDictionary.famixRep;
        //        }
        //        catch (error) {
        // logger.error(`> ERROR: got exception ${error}. Exiting...`);
        // logger.error(error.message);
        // logger.error(error.stack);
        // process.exit(1);
        //        }

        return famixRep;
    }

    private processEntities(project: Project): void {
        const onlyTypeScriptFiles = project.getSourceFiles().filter(f => f.getFilePath().endsWith('.ts'));
        processFunctions.processFiles(onlyTypeScriptFiles);
        const accesses = processFunctions.accessMap;
        const methodsAndFunctionsWithId = processFunctions.methodsAndFunctionsWithId;
        const classes = processFunctions.classes;
        const interfaces = processFunctions.interfaces;
        const modules = processFunctions.modules;
        const exports = processFunctions.listOfExportMaps;

        processFunctions.processImportClausesForImportEqualsDeclarations(project.getSourceFiles(), exports);
        processFunctions.processImportClausesForModules(modules, exports);
        processFunctions.processAccesses(accesses);
        processFunctions.processInvocations(methodsAndFunctionsWithId);
        processFunctions.processInheritances(classes, interfaces);
        processFunctions.processConcretisations(classes, interfaces, methodsAndFunctionsWithId);

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

        initFamixRep(project);

        this.processEntities(project);

        return entityDictionary.famixRep;
    }

}

function initFamixRep(project: Project): void {
    // get compiler options
    const compilerOptions = project.getCompilerOptions();

    // get baseUrl
    const baseUrl = compilerOptions.baseUrl || ".";

    const absoluteBaseUrl = path.resolve(baseUrl);

    entityDictionary.famixRep.setAbsolutePath(path.normalize(absoluteBaseUrl));
}
