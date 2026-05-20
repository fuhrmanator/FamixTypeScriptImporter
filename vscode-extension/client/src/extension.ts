import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { registerCommands } from './commands';
import { FamixModelProvider } from './modelTreeProvider';

let client: LanguageClient;
const extensionName = 'ts2famixExtension';
const extensionDisplayName = 'ts2famix Extension';

export async function activate(context: ExtensionContext) {
    const serverModule = context.asAbsolutePath(path.join('server', 'dist', 'server.js'));
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc }
    };
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'typescript' }]
    };
    client = new LanguageClient(extensionName, extensionDisplayName, serverOptions, clientOptions);
    registerCommands(context, client);
    await client.start();

    const modelProvider = new FamixModelProvider();
    vscode.window.registerTreeDataProvider('ts2famixModel', modelProvider);

    const refreshModel = () => {
        const config = vscode.workspace.getConfiguration('ts2famix');
        const modelPath = config.get<string>('FamixModelOutputFilePath', '');
        if (modelPath && fs.existsSync(modelPath)) {
            modelProvider.refresh(modelPath);
        }
    };

    const modelWatcher = vscode.workspace.createFileSystemWatcher('**/*.json');
    modelWatcher.onDidChange(refreshModel);
    modelWatcher.onDidCreate(refreshModel);
    context.subscriptions.push(modelWatcher);

    refreshModel();

    return { client };
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) { return undefined; }
    return client.stop();
}
