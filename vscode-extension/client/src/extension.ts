import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { registerCommands } from './commands';
import { FamixModelProvider } from './modelTreeProvider';
import { ModelWebviewProvider } from './modelWebviewProvider';

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
    const webviewProvider = new ModelWebviewProvider();
    vscode.window.registerTreeDataProvider('ts2famixModel', modelProvider);

    const getModelPath = () => {
        const config = vscode.workspace.getConfiguration('ts2famix');
        let modelPath = config.get<string>('FamixModelOutputFilePath', '');
        if (!modelPath) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                modelPath = path.join(workspaceFolders[0].uri.fsPath, 'model.json');
            }
        }
        return modelPath;
    };

    const refreshModel = () => {
        const modelPath = getModelPath();
        if (modelPath && fs.existsSync(modelPath)) {
            modelProvider.refresh(modelPath);
        }
    };

    // Commande pour ouvrir la webview
    context.subscriptions.push(
        vscode.commands.registerCommand('ts2famix.showDiagram', () => {
            const modelPath = getModelPath();
            webviewProvider.show(modelPath, context);
        })
    );

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