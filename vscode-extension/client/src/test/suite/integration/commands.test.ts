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
});