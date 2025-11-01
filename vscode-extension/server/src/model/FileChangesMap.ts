import { FileChangeType, FileEvent } from 'vscode-languageserver/node';
import * as url from 'url';
import { SourceFileChangeType } from 'ts2famix';

export class FileChangesMap {
    private fileChangesMap: Map<string, SourceFileChangeType> = new Map<string, SourceFileChangeType>();

    public addFile(change: FileEvent) {	
        const uri = url.fileURLToPath(change.uri);
        const actionFromEvent = getChangeTypeFromEvent(change);
        const actionToSetInMap = this.calculateFileChangeAction(actionFromEvent, uri);
        if (actionToSetInMap === 'removeFromMap') {
            this.fileChangesMap.delete(uri);
            return;
        }
        this.fileChangesMap.set(uri, actionToSetInMap);
    };
	
    public getAndClearFileChangesMap(): ReadonlyMap<string, SourceFileChangeType> {
        const mapCopy = new Map<string, SourceFileChangeType>(this.fileChangesMap);
        this.fileChangesMap.clear();
        return mapCopy;
    }

    private calculateFileChangeAction (newAction: SourceFileChangeType, filePath: string): SourceFileChangeType | 'removeFromMap' {
        const previousAction = this.fileChangesMap.get(filePath);

        switch (newAction) {
            case SourceFileChangeType.Update: {
                if (previousAction === SourceFileChangeType.Create) {
                    return SourceFileChangeType.Create;
                }
                return SourceFileChangeType.Update;
            }
            case SourceFileChangeType.Create: {
                if (previousAction === SourceFileChangeType.Delete) {
                    return SourceFileChangeType.Update;
                }
                return SourceFileChangeType.Create;
            }
            case SourceFileChangeType.Delete: {
                if (previousAction === SourceFileChangeType.Create) {
                    return 'removeFromMap';
                }
                return SourceFileChangeType.Delete;
            }
            default:
                throw new Error(`Unknown file change action: ${newAction}`);
        }
    }
}

const getChangeTypeFromEvent = (event: FileEvent): SourceFileChangeType => {
    switch (event.type) {
        case FileChangeType.Created:
            return SourceFileChangeType.Create;
        case FileChangeType.Changed:
            return SourceFileChangeType.Update;
        case FileChangeType.Deleted:
            return SourceFileChangeType.Delete;
        default:
            throw new Error(`Unknown file change type: ${event.type}`);
    }
};
