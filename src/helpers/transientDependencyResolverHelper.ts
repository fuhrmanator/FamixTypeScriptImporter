import { EntityWithSourceAnchor } from "../lib/famix/model/famix/sourced_entity";
import { EntityDictionary } from "../famix_functions/EntityDictionary";
import { Class, ImportClause, IndexedFileAnchor, Interface } from "../lib/famix/model/famix";
import { getFamixIndexFileAnchorFileName } from "./famixIndexFileAnchorHelper";
import { SourceFileChangeType } from "../analyze";
import { SourceFile } from "ts-morph";

// TODO: add tests for these methods

/** 
 * NOTE: for now the case when we create a new file and there were imports from it
 * even if it didn't exist may not be working. 
 * 
 * Ex.,:
 * fileA: *does not exists yet*
 * fileB: import { Something } from './fileA';
 * ------------------------
 * fileA: export class Something { }
 * 
 * (the fileB may not be updated here)
*/

/**
 * Based on import clauses finds the dependent files and returns the associations
 * that are transitively dependent on the changed files. It does it recursively.
 */
export const getTransientDependentEntities = (
    entityDictionary: EntityDictionary, 
    sourceFileChangeMap: Map<SourceFileChangeType, SourceFile[]>,
) => {
    const absoluteProjectPath = entityDictionary.getAbsolutePath();

    const changedFilesNames = Array.from(sourceFileChangeMap.values())
        .flat()
        .map(sourceFile => getFamixIndexFileAnchorFileName(sourceFile.getFilePath(), absoluteProjectPath));

    const transientDependentAssociations = getTransientDependentAssociations(entityDictionary, changedFilesNames);

    return transientDependentAssociations;
};

const getTransientDependentAssociations = (
    entityDictionary: EntityDictionary,
    changedFilesNames: string []
) => {
    const importClauses = entityDictionary.famixRep.getImportClauses();

    const transientDependentAssociations: Set<EntityWithSourceAnchor> = new Set();

    const unprocessedFiles: Set<string> = new Set(changedFilesNames);
    const processedFiles: Set<string> = new Set();

    while (unprocessedFiles.size > 0) {
        const file: string = unprocessedFiles.values().next().value!;
        unprocessedFiles.delete(file);
        processedFiles.add(file);

        importClauses.forEach(importClause => {
            if (importClause.moduleSpecifier === file) {
                transientDependentAssociations.add(importClause);
                if (importClause.importedEntity.isStub) {
                    transientDependentAssociations.add(importClause.importedEntity);
                }

                const importingEntityFileName = (importClause.sourceAnchor as IndexedFileAnchor).fileName;

                if (!unprocessedFiles.has(importingEntityFileName) && !processedFiles.has(importingEntityFileName)) {
                    unprocessedFiles.add(importingEntityFileName);
                }

                getOtherTransientDependencies(entityDictionary, importClause, transientDependentAssociations);
            }
        });
    }

    return transientDependentAssociations;
};

const getOtherTransientDependencies = (
    entityDictionary: EntityDictionary,
    importClause: ImportClause,
    transientDependentAssociations: Set<EntityWithSourceAnchor>
) => {
    const importedEntity = importClause.importedEntity;
    const importingEntityFileName = (importClause.sourceAnchor as IndexedFileAnchor).fileName;

    const inheritances = entityDictionary.famixRep.getInheritances();

    if (importedEntity instanceof Class || importedEntity instanceof Interface || importedEntity.isStub) {
        inheritances.forEach(inheritance => {
            const doesInheritanceContainImportedEntity = inheritance.superclass === importClause.importedEntity && 
                importingEntityFileName === (inheritance.sourceAnchor as IndexedFileAnchor).fileName;

            if (doesInheritanceContainImportedEntity) {
                transientDependentAssociations.add(inheritance);
            } else if (inheritance.superclass.isStub) {
                transientDependentAssociations.add(inheritance);
                transientDependentAssociations.add(inheritance.superclass);
            }
        });                
    }

    // TODO: find the other associations between the imported entity and the sourceFile
};