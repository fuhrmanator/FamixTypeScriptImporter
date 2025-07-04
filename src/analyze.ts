import { Project } from "ts-morph";
import * as fs from 'fs';
import { FamixRepository } from "./lib/famix/famix_repository";
import { Logger } from "tslog";
import { EntityDictionary, EntityDictionaryConfig } from "./famix_functions/EntityDictionary";
import path from "path";
import { TypeScriptToFamixProcessor  } from "./analyze_functions/process_functions";

export const logger = new Logger({ name: "ts2famix", minLevel: 2 });

/**
 * This class is used to build a Famix model from a TypeScript source code
 */
export class Importer {
    private entityDictionary: EntityDictionary;
    private processFunctions: TypeScriptToFamixProcessor ;

    private project = new Project(
        {
            compilerOptions: {
                baseUrl: "./test_src"
            }
        }
    ); // The project containing the source files to analyze

    constructor(config: EntityDictionaryConfig = { expectGraphemes: false }) {
        this.entityDictionary = new EntityDictionary(config);
        this.processFunctions = new TypeScriptToFamixProcessor (this.entityDictionary);
    }

    /**
     * Main method
     * @param paths An array of paths to the source files to analyze
     * @returns The Famix repository containing the Famix model
     */
    public famixRepFromPaths(paths: Array<string>): FamixRepository {

        //        try {
        logger.debug(`famixRepFromPaths: paths: ${paths}`);

        this.project.addSourceFilesAtPaths(paths);

        this.initFamixRep(this.project);

        this.processEntities(this.project);

        const famixRep = this.entityDictionary.famixRep;
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
        this.processFunctions.processFiles(onlyTypeScriptFiles);
        const accesses = this.processFunctions.accessMap;
        const methodsAndFunctionsWithId = this.processFunctions.methodsAndFunctionsWithId;
        const classes = this.processFunctions.classes;
        const interfaces = this.processFunctions.interfaces;
        const modules = this.processFunctions.modules;
        const exports = this.processFunctions.listOfExportMaps;

        this.processFunctions.processImportClausesForImportEqualsDeclarations(project.getSourceFiles(), exports);
        this.processFunctions.processImportClausesForModules(modules, exports);
        this.processFunctions.processAccesses(accesses);
        this.processFunctions.processInvocations(methodsAndFunctionsWithId);
        this.processFunctions.processInheritances(classes, interfaces);
        this.processFunctions.processConcretisations(classes, interfaces, methodsAndFunctionsWithId);

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

        this.initFamixRep(project);

        this.processEntities(project);

        return this.entityDictionary.famixRep;
    }

    private initFamixRep(project: Project): void {
        // get compiler options
        const compilerOptions = project.getCompilerOptions();
    
        // get baseUrl
        const baseUrl = compilerOptions.baseUrl || ".";
    
        const absoluteBaseUrl = path.resolve(baseUrl);
    
        this.entityDictionary.setAbsolutePath(path.normalize(absoluteBaseUrl));
    }
}
