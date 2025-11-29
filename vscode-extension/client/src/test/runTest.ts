import * as path from 'path';
import { runTests } from '@vscode/test-electron';

// https://code.visualstudio.com/api/working-with-extensions/testing-extension#custom-setup-with-atvscodetestelectron
async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-extensions' // Disable all other extensions
            ]
        });
    } catch {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();