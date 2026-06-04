import * as vscode from 'vscode';
import { LanguageClient, ResponseMessage } from 'vscode-languageclient/node';

const commandName = 'ts2famix.generateModelForProject';
const serverMethodName = 'generateModelForProject';

export const registerCommands = (context: vscode.ExtensionContext, client: LanguageClient) => {
    const generateModelForCurrentFile = vscode.commands.registerCommand(commandName, async () => {		
        if (client) {
            try {
                if (!client.isRunning()) {
                    vscode.window.showErrorMessage('ts2famix: Server is not running. Try reloading VSCode.');
                    return;
                }
                const response = await client.sendRequest<ResponseMessage>(serverMethodName);
                if (response && response.error) {
                    const code = response.error.code;
                    const message = String(response.error.message || response.error.data || 'Unknown error');
                    const data = response.error.data;
                    const detail = data && String(data) !== message ? ` — ${String(data)}` : '';
                    vscode.window.showErrorMessage(`Failed to generate model [${code}]: ${message}${detail}`);
                } else {
                    vscode.window.showInformationMessage('Successfully generated Famix model.');
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(`Failed to generate model (exception): ${errorMsg}`);
            }
        }
    });
    context.subscriptions.push(generateModelForCurrentFile);
};
