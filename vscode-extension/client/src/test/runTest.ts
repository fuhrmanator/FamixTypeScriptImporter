import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        const workspacePath = path.resolve(
            __dirname,
            '../../src/test/fixtures/project-with-tsconfig'
        );
        const extensionTestsPath = path.resolve(__dirname, './suite/index');
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                workspacePath,
                '--disable-extensions'
            ]
        });
    } catch (err) {
        console.error(`Failed to run tests: ${err}`);
        process.exit(1);
    }
}

main();
