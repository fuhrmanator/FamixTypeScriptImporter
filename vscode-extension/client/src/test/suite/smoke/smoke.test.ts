import { TestHelper } from '../../helper';
import * as vscode from 'vscode';
import * as assert from 'assert';

suite('Smoke Tests', function() {
    this.timeout(30000);
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
        await TestHelper.waitForServerToInitialize();
  
        try {
            const mockFilePath = 'c:\\path\\to\\mock\\tsconfig.json';
            const response = await client.sendRequest<{result?: null; error?: string;}>('generateModelForProject', { filePath: mockFilePath });
      
            assert.ok(response, 'Should receive a response from the server');
            assert.strictEqual(response.result, null, 'Response should indicate failure due to mock path');
            //assert.ok(response.error, 'Response should include an error message');
        } catch (error) {
            assert.fail(`Failed to communicate with the server: ${error}`);
        }
    });
    test('Generates Famix model for a TypeScript project', async function() {
        const fs = require('fs');
        const path = require('path');

        const fixturePath = path.resolve(__dirname, '../../../../src/test/fixtures/project-with-tsconfig');
        const modelPath = path.join(fixturePath, 'model.json');

        // S'assurer que model.json n'existe pas avant le test
        if (fs.existsSync(modelPath)) {
            fs.unlinkSync(modelPath);
        }
        assert.ok(!fs.existsSync(modelPath), 'model.json should not exist before the test');

        // Configurer le chemin du modèle
        const config = vscode.workspace.getConfiguration('ts2famix');
        await config.update('FamixModelOutputFilePath', modelPath, vscode.ConfigurationTarget.Global);

        // Invoquer la commande de génération
        await vscode.commands.executeCommand('ts2famix.generateModelForProject');

        // Attendre que le fichier soit généré
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Vérifier que model.json existe
        assert.ok(fs.existsSync(modelPath), 'model.json should exist after generation');

        // Nettoyer
        fs.unlinkSync(modelPath);
        assert.ok(!fs.existsSync(modelPath), 'model.json should be deleted after the test');
    });
});
