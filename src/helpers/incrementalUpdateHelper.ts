import { Class } from '../lib/famix/model/famix/class';
import { FamixBaseElement } from "../lib/famix/famix_base_element";
import { ImportClause, IndexedFileAnchor, Inheritance, Interface, NamedEntity } from '../lib/famix/model/famix';
import { EntityWithSourceAnchor } from '../lib/famix/model/famix/sourced_entity';
import { SourceFileChangeType } from '../analyze';
import { SourceFile } from 'ts-morph';
import { getFamixIndexFileAnchorFileName } from './famixIndexFileAnchorHelper';
import { FamixRepository } from '../lib/famix/famix_repository';

// TODO: add tests for these methods
export const getSourceFilesToUpdate = (
    dependentAssociations: EntityWithSourceAnchor[],
    sourceFileChangeMap: Map<SourceFileChangeType, SourceFile[]>,
    allSourceFiles: SourceFile[],
    projectBaseUrl: string
) => {
    const sourceFilesToEnsureEntities = [
        ...(sourceFileChangeMap.get(SourceFileChangeType.Create) || []),
        ...(sourceFileChangeMap.get(SourceFileChangeType.Update) || []),
    ];

    const dependentFileNames = getDependentSourceFileNames(dependentAssociations);
    const dependentFileNamesToAdd = Array.from(dependentFileNames)
        .map(fileName => getFamixIndexFileAnchorFileName(fileName, projectBaseUrl))
        .filter(
            fileName => !Array.from(sourceFileChangeMap.values())
            .flat().some(sourceFile => sourceFile.getFilePath() === fileName));

    const dependentFiles = allSourceFiles.filter(
        sourceFile => {
            const filePath = getFamixIndexFileAnchorFileName(sourceFile.getFilePath(), projectBaseUrl);
            return dependentFileNamesToAdd.includes(filePath);
        }
    );

    return sourceFilesToEnsureEntities.concat(dependentFiles);
};

const getDependentSourceFileNames = (dependentAssociations: EntityWithSourceAnchor[]) => {
    const dependentFileNames = new Set<string>();

    dependentAssociations.forEach(entity => {
            // todo: ? sourceAnchor instead of indexedfileAnchor
        dependentFileNames.add((entity.sourceAnchor as IndexedFileAnchor).fileName);
    });

    return dependentFileNames;
};

/**
 * Finds all the associations that include the given entities as dependencies
 */
export const getDirectDependentAssociations = (entities: FamixBaseElement[]) => {
    const dependentAssociations: EntityWithSourceAnchor[] = [];

    entities.forEach(entity => {
        dependentAssociations.push(...getDependentAssociationsForEntity(entity));
    });

    return dependentAssociations;
};

const getDependentAssociationsForEntity = (entity: FamixBaseElement) => {
    const dependentAssociations: EntityWithSourceAnchor[] = [];

    const addElementFileToSet = (association: EntityWithSourceAnchor) => {
        dependentAssociations.push(association);
    };

    if (entity instanceof Class) {
        Array.from(entity.subInheritances).forEach(inheritance => {
            addElementFileToSet(inheritance);
        });
    } else if (entity instanceof Interface) {
        Array.from(entity.subInheritances).forEach(inheritance => {
            addElementFileToSet(inheritance);
        });
    }
    
    if (entity instanceof NamedEntity) {
        Array.from(entity.incomingImports).forEach(importClause => {
            addElementFileToSet(importClause);
        });
    }
    // TODO: add other associations

    return dependentAssociations;
};

export const removeDependentAssociations = (
    famixRep: FamixRepository,
    dependentAssociations: EntityWithSourceAnchor[]) => {
    // NOTE: removing the depending associations because they will be recreated later
    famixRep.removeElements(dependentAssociations);
    famixRep.removeElements(dependentAssociations.map(x => x.sourceAnchor));

    dependentAssociations.forEach(association => {
        if (association instanceof Inheritance) {
            association.superclass.removeSubInheritance(association);
            association.subclass.removeSuperInheritance(association);
        } else if (association instanceof ImportClause) {
            association.importedEntity.incomingImports.delete(association);
            association.importingEntity.outgoingImports.delete(association);
        }
    });
};