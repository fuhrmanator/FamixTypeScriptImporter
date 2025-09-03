import { Project, SourceFile } from "ts-morph";
import * as fs from 'fs';
import { FamixRepository } from "./lib/famix/famix_repository";
import { Logger } from "tslog";
import { EntityDictionary, EntityDictionaryConfig } from "./famix_functions/EntityDictionary";
import path from "path";
import { TypeScriptToFamixProcessingContext  } from "./analyze_functions/process_functions";
import { getFamixIndexFileAnchorFileName } from "./helpers";
import { isSourceFileAModule } from "./famix_functions/helpersTsMorphElementsProcessing";
import { FamixBaseElement } from "./lib/famix/famix_base_element";
import { getDirectDependentAssociations, getSourceFilesToUpdate, removeDependentAssociations } from "./helpers";
import { getTransientDependentEntities } from "./helpers/transientDependencyResolverHelper";

export const logger = new Logger({ name: "ts2famix", minLevel: 2 });

export enum SourceFileChangeType {
    Create = 0,
    Update = 1,
    Delete = 2,
}

/**
 * This class is used to build a Famix model from a TypeScript source code
 */
export class Importer {
    private entityDictionary: EntityDictionary;
    private typeScriptToFamixProcessingContext: TypeScriptToFamixProcessingContext ;

    private project = new Project(
        {
            compilerOptions: {
                baseUrl: "./test_src"
            }
        }
    ); // The project containing the source files to analyze

    constructor(config: EntityDictionaryConfig = { expectGraphemes: false }) {
        this.entityDictionary = new EntityDictionary(config);
        this.typeScriptToFamixProcessingContext = new TypeScriptToFamixProcessingContext (this.entityDictionary);
    }

    /**
     * Main method
     * @param paths An array of paths to the source files to analyze
     * @returns The Famix repository containing the Famix model
     */
    public famixRepFromPaths(paths: Array<string>): FamixRepository {

        logger.debug(`famixRepFromPaths: paths: ${paths}`);

        this.project.addSourceFilesAtPaths(paths);

        this.initFamixRep(this.project);

        this.processEntities(this.project);

        const famixRep = this.entityDictionary.famixRep;

        return famixRep;
    }

    private processEntities(project: Project): void {
        const onlyTypeScriptFiles = project.getSourceFiles().filter(f => f.getFilePath().endsWith('.ts'));
        this.typeScriptToFamixProcessingContext.processFiles(onlyTypeScriptFiles);
        
        this.processReferences(onlyTypeScriptFiles, onlyTypeScriptFiles);
    }

    private processReferences(sourceFiles: SourceFile[], allExistingSourceFiles: SourceFile[]): void {        
        // TODO: we may process Invocations, Concretisations here if they are not processed when processing methods/functions, classes/interfaces and modules
        this.typeScriptToFamixProcessingContext.processImportClausesForImportEqualsDeclarations(allExistingSourceFiles);
        
        const modules = sourceFiles.filter(f => isSourceFileAModule(f));
        this.typeScriptToFamixProcessingContext.processImportClausesForModules(modules);
        // this.processFunctions.Invocations();
        // etc.
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
        this.project = project;
        this.initFamixRep(project);

        this.processEntities(project);

        return this.entityDictionary.famixRep;
    }

    public updateFamixModelIncrementally(sourceFileChangeMap: Map<SourceFileChangeType, SourceFile[]>): void {
        const allChangedSourceFiles = Array.from(sourceFileChangeMap.values()).flat();

        const removedEntities: FamixBaseElement[] = [];
        allChangedSourceFiles.forEach(
            file => {
                const filePath = getFamixIndexFileAnchorFileName(file.getFilePath(), this.entityDictionary.getAbsolutePath());
                const removed = this.entityDictionary.famixRep.removeEntitiesBySourceFile(filePath);
                removedEntities.push(...removed);
            }
        );

        const allSourceFiles = this.project.getSourceFiles();
        const directDependentAssociations = getDirectDependentAssociations(removedEntities);
        const transientDependentAssociations = getTransientDependentEntities(this.entityDictionary, sourceFileChangeMap);

        const associationsToRemove = [...directDependentAssociations, ...transientDependentAssociations];

        removeDependentAssociations(this.entityDictionary.famixRep, associationsToRemove);

        const sourceFilesToEnsure = getSourceFilesToUpdate(
            associationsToRemove, sourceFileChangeMap, allSourceFiles, this.entityDictionary.getAbsolutePath()
        );

        this.typeScriptToFamixProcessingContext.processFiles(sourceFilesToEnsure);
        const sourceFilesToDelete = sourceFileChangeMap.get(SourceFileChangeType.Delete) || [];
        const existingSourceFiles = allSourceFiles.filter(
            file => !sourceFilesToDelete.includes(file)
        );
        this.processReferences(sourceFilesToEnsure, existingSourceFiles);

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
