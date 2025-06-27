import { TestHelper } from '../../helper';
import * as vscode from 'vscode';
import * as assert from 'assert';

suite('Smoke Tests', () => {  
  test('Extension loads and activates without errors', async () => {
    const extensionId = TestHelper.getExtensionId();
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, 'Extension should be installed');
    
    if (!extension.isActive) {
      await extension.activate();
    }
    
    assert.ok(extension.isActive, 'Extension should activate successfully');
  });

  test('Client starts', async function() {
    const extensionId = TestHelper.getExtensionId();
    await TestHelper.waitForExtensionActivation(extensionId);
    
    const client = await TestHelper.waitForLanguageClient(extensionId);
    
    assert.ok(client, 'Language client should be available');
    assert.ok(client.isRunning(), 'Client should be running');
  });

  test('Client-server connection is established', async function() {   
    const extensionId = TestHelper.getExtensionId();
    await TestHelper.waitForExtensionActivation(extensionId);
    
    const client = await TestHelper.waitForLanguageClient(extensionId);
    
    try {
      const mockFilePath = 'c:\\path\\to\\mock\\tsconfig.json';
      const response = await client.sendRequest<{success: boolean; error?: string; outputPath?: string}>('generateModelForProject', { filePath: mockFilePath });
      
      assert.ok(response, 'Should receive a response from the server');
      assert.strictEqual(response.success, false, 'Response should indicate failure due to mock path');
      assert.ok(response.error, 'Response should include an error message');
    } catch (error) {
      assert.fail(`Failed to communicate with the server: ${error}`);
    }
  });
});
