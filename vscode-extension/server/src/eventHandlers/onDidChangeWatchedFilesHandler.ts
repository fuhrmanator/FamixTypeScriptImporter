import { createConnection, DidChangeWatchedFilesParams } from 'vscode-languageserver/node';
import { FileChangesMap } from '../model/FileChangesMap';
import { FamixProjectManager } from '../model/FamixProjectManager';
import { minimatch } from 'minimatch';
import * as url from 'url';

export const onDidChangeWatchedFiles = async (
    params: DidChangeWatchedFilesParams,
    connection: ReturnType<typeof createConnection>, 
    fileChangesMap: FileChangesMap,
    famixProjectManager: FamixProjectManager,
    globPatternsForFilesToExclude: string[],
) => {
    for (const change of params.changes) {
        const shouldBeExcluded = globPatternsForFilesToExclude.some(
            pattern => minimatch(url.fileURLToPath(change.uri), pattern)
        );
        if (shouldBeExcluded) {
            continue;
        }
        fileChangesMap.addFile(change);
    }

    const mapSlice = fileChangesMap.getAndClearFileChangesMap();
    if (mapSlice.size === 0) {
        return;
    }

    try {
        await famixProjectManager.updateFamixModelIncrementally(mapSlice);

        const exportResult = await famixProjectManager.generateNewJsonForFamixModel();
        if (exportResult.isErr()) {
            connection.window.showErrorMessage(exportResult.error.message);
            return;
        }
    } catch (error) {
        connection.window.showErrorMessage(`Error processing file changes: ${error}`);
        return;
    }
};
