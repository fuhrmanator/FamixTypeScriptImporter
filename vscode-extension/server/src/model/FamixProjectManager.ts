import { FileSystemRefreshResult, Project, SourceFile } from 'ts-morph';
import { FamixRepository, Importer, SourceFileChangeType } from 'ts2famix';
import { FamixModelExporter } from './FamixModelExporter';
import { Result } from 'neverthrow';

export class FamixProjectManager {
    private _importer: Importer;
    private _famixRep: FamixRepository | undefined;
    private _modelExporter: FamixModelExporter;
    private _project: Project | undefined;

    constructor(famixModelExporter: FamixModelExporter) {
        this._importer = new Importer();
        this._modelExporter = famixModelExporter;
    }

    private get project(): Project {
        if (!this._project) {
            throw new Error('Project is not initialized.');
        }
        return this._project;
    }

    public initializeFamixModel(project: Project): void {
        this._famixRep = this._importer.famixRepFromProject(project);
        this._project = project;
    }

    public async generateFamixModelFromScratch(project: Project): Promise<Result<void, Error>> {
        this._importer = new Importer();
        this._famixRep = this._importer.famixRepFromProject(project);
        this._project = project;
        return this.generateNewJsonForFamixModel();
    }

    public async updateFamixModelIncrementally(fileChangesMap: ReadonlyMap<string, SourceFileChangeType>): Promise<void> {
        const sourceFileChangeMap = await this.getUpdatedTsMorphSourceFiles(fileChangesMap);

        this._importer.updateFamixModelIncrementally(sourceFileChangeMap);

        sourceFileChangeMap.get(SourceFileChangeType.Delete)?.forEach(
            file => {
                this.project.removeSourceFile(file);
            }
        );
    }

    private async getUpdatedTsMorphSourceFiles(fileChangesMap: ReadonlyMap<string, SourceFileChangeType>): Promise<Map<SourceFileChangeType, SourceFile[]>> {
        const refreshPromises = Array.from(fileChangesMap.entries()).map(async ([filePath, change]) => {
            let sourceFile = this.project.getSourceFile(filePath);
            if (sourceFile) {
                if (change === SourceFileChangeType.Delete) {
                    // NOTE: do not remove sourceFile from the project yet, it will forget the whole file
                    // https://ts-morph.com/details/source-files#refresh-from-file-system
                    return { sourceFile, change };
                }
                const result = await sourceFile.refreshFromFileSystem();
                if (result !== FileSystemRefreshResult.NoChange) {
                    return { sourceFile, change };
                }
                return null;
            }
            sourceFile = this.project.addSourceFileAtPath(filePath);
            return { sourceFile, change };
        });

        const results = (await Promise.all(refreshPromises))
            .filter(result => result !== null) as { sourceFile: SourceFile; change: SourceFileChangeType }[];

        return results.reduce((acc, { sourceFile, change }) => {
            if (!acc.has(change)) {
                acc.set(change, []);
            }
            acc.get(change)!.push(sourceFile);
            return acc;
        }, new Map<SourceFileChangeType, SourceFile[]>());
    };

    public generateNewJsonForFamixModel(): Promise<Result<void, Error>> {
        if (!this._famixRep) {
            throw new Error('Famix model is not initialized.');
        }
        return this._modelExporter.exportModelToFile(this._famixRep);
    }
}
