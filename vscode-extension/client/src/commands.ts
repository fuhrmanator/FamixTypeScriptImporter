import * as vscode from 'vscode';
import { LanguageClient, ResponseMessage } from 'vscode-languageclient/node';

const commandName = 'ts2famix.generateModelForProject';
const serverMethodName = 'generateModelForProject';

export const registerCommands = (context: vscode.ExtensionContext, client: LanguageClient) => {
    const generateModelForCurrentFile = vscode.commands.registerCommand(commandName, async () => {		
        if (client) {
            if (!client.isRunning()) {
                await client.start();
            }
            const response = await client.sendRequest<ResponseMessage>(serverMethodName);
            if (response && response.error) {
                vscode.window.showErrorMessage(`Failed to generate model: ${response.error.data}`);
            } else {
                vscode.window.showInformationMessage('Successfully generated Famix model.');
            }
        }
    });
    context.subscriptions.push(generateModelForCurrentFile);
};


