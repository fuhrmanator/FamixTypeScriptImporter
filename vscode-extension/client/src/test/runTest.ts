import * as path from 'path';
import * as fs from 'fs';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        const vsixDir = path.resolve(__dirname, '../../..');
        const vsixFiles = fs.readdirSync(vsixDir)
            .filter(f => f.endsWith('.vsix'))
            .sort();

        if (vsixFiles.length === 0) {
            throw new Error('No .vsix file found. Run vsce package first.');
        }

        const vsixFile = path.resolve(vsixDir, vsixFiles[vsixFiles.length - 1]);
        console.log(`Testing .vsix: ${vsixFile}`);

        const workspacePath = path.resolve(__dirname, '../../src/test/fixtures/project-with-tsconfig');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        await runTests({
            extensionDevelopmentPath: path.resolve(__dirname, '../../../'),
            extensionTestsPath,
            launchArgs: [
                workspacePath,
                `--install-extension=${vsixFile}`,
                '--disable-extensions',
                '--disable-extension=Leo-maure.ts2famix-vscode-extension'
            ]
        });
    } catch (err) {
        console.error(`Failed to run tests: ${err}`);
        process.exit(1);
    }
}

main();