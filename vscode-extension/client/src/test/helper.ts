import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

export class TestHelper {
    static getExtensionId(): string {
        const packageJsonPath = path.join(__dirname, '../../..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const extensionName = packageJson.name;
        const publisher = packageJson.publisher || 'undefined_publisher';
        return `${publisher}.${extensionName}`;
    }

    static async waitForExtensionActivation(extensionId: string, timeout = 30000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const extension = vscode.extensions.getExtension(extensionId);
      
            if (extension) {
                if (!extension.isActive) {
                    try {
                        await extension.activate();
                        return extension;
                    } catch (error) {
                        throw new Error(`Extension activation failed: ${error}`);
                    }
                } else {
                    return extension;
                }
            }
      
            await this.sleep(500);
        }
    
        throw new Error(
            `Extension ${extensionId} not activated within ${timeout}ms. `
        );
    }

    static async waitForLanguageClient(extensionId: string, timeout = 15000): Promise<LanguageClient> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const extension = vscode.extensions.getExtension(extensionId);
            if (extension?.isActive && extension.exports) {
                const client = extension.exports.client;
                if (client) {
                    return client;
                }
            }
      
            await this.sleep(500);
        }
    
        throw new Error(`Language Client not available within ${timeout}ms`);
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
