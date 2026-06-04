import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as cp from 'child_process';
import {
    runTests,
    downloadAndUnzipVSCode,
    resolveCliArgsFromVSCodeExecutablePath,
} from '@vscode/test-electron';

function findLatestVsix(vsixDir: string): string {
    const vsixFiles = fs.readdirSync(vsixDir)
        .filter(f => f.endsWith('.vsix'))
        .sort();

    if (vsixFiles.length === 0) {
        throw new Error('No .vsix file found. Run vsce package first.');
    }

    return path.resolve(vsixDir, vsixFiles[vsixFiles.length - 1]);
}

function installVsix(
    vscodeExecutablePath: string,
    vsixFile: string,
    userDataDir: string,
    extensionsDir: string
): void {
    const [cliPath, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);

    const args = [
        ...cliArgs,
        '--user-data-dir', userDataDir,
        '--extensions-dir', extensionsDir,
        '--install-extension', vsixFile,
        '--force',
    ];

    console.log(`VSIX install CLI: ${cliPath}`);
    console.log(`VSIX install args: ${JSON.stringify(args)}`);

    const result = cp.spawnSync(
        cliPath,
        args,
        {
            stdio: 'inherit',
            encoding: 'utf-8',
            shell: process.platform === 'win32',
        }
    );

    if (result.error) {
        throw new Error(
            `VSIX install failed to start: ${result.error.message}\n` +
            `CLI: ${cliPath}\n` +
            `Args: ${JSON.stringify(args)}`
        );
    }

    if (result.signal) {
        throw new Error(
            `VSIX install terminated by signal ${result.signal}\n` +
            `CLI: ${cliPath}\n` +
            `Args: ${JSON.stringify(args)}`
        );
    }

    if (result.status !== 0) {
        throw new Error(
            `VSIX install failed with exit code ${result.status}\n` +
            `CLI: ${cliPath}\n` +
            `Args: ${JSON.stringify(args)}`
        );
    }
}

async function main() {
    try {
        const extensionRoot = path.resolve(__dirname, '../../..');
        const vsixFile = findLatestVsix(extensionRoot);
        console.log(`Testing VSIX only: ${vsixFile}`);

        const workspacePath = path.resolve(
            __dirname,
            '../../src/test/fixtures/project-with-tsconfig'
        );
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'ts2famix-vsix-test-'));
        const userDataDir = path.join(tmpBase, 'user-data');
        const extensionsDir = path.join(tmpBase, 'extensions');
        fs.mkdirSync(userDataDir, { recursive: true });
        fs.mkdirSync(extensionsDir, { recursive: true });

        const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');

        // Install only the packaged extension into an isolated profile.
        installVsix(vscodeExecutablePath, vsixFile, userDataDir, extensionsDir);

        // Important: extensionDevelopmentPath points to a tiny harness extension,
        // not your real source extension. This prevents source fallback.
        const harnessExtensionPath = path.resolve(__dirname, '../../test-harness');

        if (!fs.existsSync(path.join(harnessExtensionPath, 'package.json'))) {
            throw new Error(`Harness extension not found at ${harnessExtensionPath}`);
        }
        await runTests({
            vscodeExecutablePath,
            extensionDevelopmentPath: harnessExtensionPath,
            extensionTestsPath,
            launchArgs: [
                workspacePath,
                '--user-data-dir', userDataDir,
                '--extensions-dir', extensionsDir,
            ],
        });
    } catch (err) {
        console.error(`Failed to run VSIX-only tests: ${err}`);
        process.exit(1);
    }
}

main();
