import * as path from 'path';
import { ExtensionContext } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';
import { registerCommands } from './commands';

let client: LanguageClient;

const extensionName = 'ts2famixExtension';
const extensionDisplayName = 'ts2famix Extension';

export async function activate(context: ExtensionContext) {
    const serverModule = context.asAbsolutePath(
        path.join('server', 'dist', 'server.js')
    );

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'typescript' }],
    };

    client = new LanguageClient(
        extensionName,
        extensionDisplayName,
        serverOptions,
        clientOptions
    );

    registerCommands(context, client);

    // Start the client. This will also launch the server
    await client.start();

    return {
        client: client
    };
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
