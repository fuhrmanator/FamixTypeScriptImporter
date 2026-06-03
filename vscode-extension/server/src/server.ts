import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    TextDocumentSyncKind,
    DidChangeWatchedFilesRegistrationOptions,
    WatchKind,
    RegistrationRequest,
} from 'vscode-languageserver/node';

import {
    TextDocument
} from 'vscode-languageserver-textdocument';
import { registerCommandHandlers } from './commandHandlers';
import { registerEventHandlers } from './eventHandlers';
import { getTsMorphProject } from 'ts2famix';
import { createGlobPatternsToWatch, findTypeScriptProject } from './utils';
import { FamixProjectManager } from './model/FamixProjectManager';
import { FamixModelExporter } from './model/FamixModelExporter';
import { err } from 'neverthrow';

let hasDidChangeWatchedFilesCapability = false;

const connection = createConnection(ProposedFeatures.all);

const famixModelExporter = new FamixModelExporter(connection);
const famixProjectManager = new FamixProjectManager(famixModelExporter);

const documents = new TextDocuments(TextDocument);

documents.listen(connection);

connection.onInitialize((params) => {
    connection.console.log(`[Server(${process.pid})] Started and initialize received`);
    const capabilities = params.capabilities;

    hasDidChangeWatchedFilesCapability = !!(
        capabilities.workspace &&
        capabilities.workspace.didChangeWatchedFiles 
    );

    return {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: TextDocumentSyncKind.None
            }
        }
    };
});

connection.onInitialized(async () => {
    if (hasDidChangeWatchedFilesCapability) {
        try {
            const result = await findTypeScriptProject(connection);
            if (result.isErr()) {
                connection.window.showErrorMessage(result.error.message);
                return err(result.error);
            }
            const { tsConfigPath, baseUrl } = result.value;

            const globPatternForFilesToWatch = createGlobPatternsToWatch();
            const registrationOptions: DidChangeWatchedFilesRegistrationOptions = {
                watchers: [
                    { 
                        globPattern: globPatternForFilesToWatch, 
                        kind: WatchKind.Create | WatchKind.Change | WatchKind.Delete 
                    }
                ]
            };
    
            const ts2famixFileWatcherId = 'ts2famix-file-watcher';
            await connection.sendRequest(RegistrationRequest.type, {
                registrations: [{
                    id: ts2famixFileWatcherId,
                    method: 'workspace/didChangeWatchedFiles',
                    registerOptions: registrationOptions
                }]
            });
            
            registerEventHandlers(connection, famixProjectManager, tsConfigPath);
            const tsMorphProject = getTsMorphProject(tsConfigPath, baseUrl);
            famixProjectManager.initializeFamixModel(tsMorphProject);
        } catch (error) {
            connection.console.error(`Failed to register file watcher: ${error}`);
            // TODO: Handle the error here
        }
    } else {
        //TODO: Handle the case when the client does not support dynamic registration
    }
});


registerCommandHandlers(connection, famixProjectManager);

connection.listen();
