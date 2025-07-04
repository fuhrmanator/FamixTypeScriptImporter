import * as vscode from 'vscode';
import * as assert from 'assert';
import { TestHelper } from '../../helper';

suite('Commands Integration', () => {  suiteSetup(async function() {
    // NOTE: Timeout to ensure the extension is fully activated
    this.timeout(10000);
    
    const extensionId = TestHelper.getExtensionId();
    
    const extension = vscode.extensions.getExtension(extensionId);
    if (extension) {
        if (!extension.isActive) {
            await extension.activate();
        }
        console.log('Extension activated successfully');
    } else {
        console.warn(`Extension not found: ${extensionId}`);
        console.log('Make sure the extension ID matches the "name" in package.json');
    }
});
  
test('generateModelForProject command is registered', async function() {
    const commands = await vscode.commands.getCommands(true);
    const isRegistered = commands.includes('ts2famix.generateModelForProject');
    assert.ok(isRegistered, 
        'ts2famix.generateModelForProject command should be registered');
});

test('Command shows warning when no active editor', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    let warningShown = false;
    const originalShowWarning = vscode.window.showWarningMessage;
    
    vscode.window.showWarningMessage = (async (message: string, ...items: string[]) => {
        if (message === 'No active editor found.') {
            warningShown = true;
        }
        return originalShowWarning(message, ...items);
    }) as typeof vscode.window.showWarningMessage;
    
    await vscode.commands.executeCommand('ts2famix.generateModelForProject');
    
    vscode.window.showWarningMessage = originalShowWarning;
    
    assert.ok(warningShown, 'Warning should be shown when no active editor');
});
});