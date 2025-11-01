import { createConnection } from 'vscode-languageserver/node';
import { onDidChangeWatchedFiles } from './onDidChangeWatchedFilesHandler';
import { FileChangesMap } from '../model/FileChangesMap';
import { FamixProjectManager } from '../model/FamixProjectManager';
import { createExcludeGlobPatternsFromTsConfig } from '../utils';

export const registerEventHandlers = (
    connection: ReturnType<typeof createConnection>,
    famixProjectManager: FamixProjectManager,
    tsConfigPath: string
) => {
    const fileChangesMap = new FileChangesMap();
    // TODO: consider changing the event type to onDidSaveTextDocument.
    // The onDidChangeWatchedFiles event is triggered for all file changes, including external like git branch checkout.
    // We may want to rebuild only when user presses Save.
    // On the other hand, onDidSaveTextDocument does not support file creation, deletion or renaming events,
    // For this we may leave the onDidChangeWatchedFiles (with Create and Delete type)
    // or use onDidCreateFiles, onDidDeleteFiles, onDidRenameFiles events.

    // TODO: We need to add clearer specification of which user's actions or external actions should trigger the rebuild.
    // Also consider all the edge cases, like workspace folder changes, configuration change, etc.
    // Consider options to make a dialog with a user.
    // The integration tests should be added as well.
    // We may take a look on how ESLint or similar tools handles this.

    // TODO: if tsConfig changed - we may need to update the globPatternsForFilesToExclude
    const globPatternsForFilesToExclude = createExcludeGlobPatternsFromTsConfig(tsConfigPath);
    connection.onDidChangeWatchedFiles(params => onDidChangeWatchedFiles(params, connection, fileChangesMap, famixProjectManager, globPatternsForFilesToExclude));
};
