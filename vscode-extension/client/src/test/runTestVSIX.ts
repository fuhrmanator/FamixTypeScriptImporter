import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as cp from 'child_process';
import {
    runTests,
    downloadAndUnzipVSCode,
    resolveCliArgsFromVSCodeExecutablePath,
} from '@vscode/test-electron';

function findVsix(vsixDir: string): string {
    // Derive the exact filename from package.json (same logic vsce uses)
    const pkg = JSON.parse(fs.readFileSync(path.join(vsixDir, 'package.json'), 'utf-8'));
    const vsixFile = path.resolve(vsixDir, `${pkg.name}-${pkg.version}.vsix`);

    if (!fs.existsSync(vsixFile)) {
        throw new Error(`Expected VSIX not found: ${vsixFile}\nRun vsce package first.`);
    }

    return vsixFile;
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

    console.log(`[VSIX Test] Installing: ${vsixFile}`);
    console.log(`[VSIX Test] To: ${extensionsDir}`);

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
            `CLI: ${cliPath}`
        );
    }

    if (result.signal) {
        throw new Error(`VSIX install terminated by signal ${result.signal}`);
    }

    if (result.status !== 0) {
        throw new Error(`VSIX install failed with exit code ${result.status}`);
    }

    console.log(`[VSIX Test] Install successful`);
}

async function main() {
    try {
        const extensionRoot = path.resolve(__dirname, '../../..');
        const vsixFile = findVsix(extensionRoot);
        console.log(`\n[VSIX Test] Testing packaged extension: ${vsixFile}\n`);

        const workspacePath = path.resolve(
            __dirname,
            '../../src/test/fixtures/project-with-tsconfig'
        );

        // Point to index.ts which sets up mocha and discovers all test files
        const extensionTestsPath = path.resolve(__dirname, './suite');

        const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'ts2famix-vsix-test-'));
        const userDataDir = path.join(tmpBase, 'user-data');
        const extensionsDir = path.join(tmpBase, 'extensions');
        fs.mkdirSync(userDataDir, { recursive: true });
        fs.mkdirSync(extensionsDir, { recursive: true });

        console.log(`[VSIX Test] Isolated profile: ${tmpBase}\n`);

        const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');

        // Install the packaged extension into isolated profile
        installVsix(vscodeExecutablePath, vsixFile, userDataDir, extensionsDir);

        // Critical: use a minimal dummy extension, NOT your real source
        // This prevents VS Code from loading the source extension as fallback
        const dummyExtensionPath = path.resolve(__dirname, '../../.vscode-test-dummy');
        fs.mkdirSync(dummyExtensionPath, { recursive: true });
        const dummyManifest = path.join(dummyExtensionPath, 'package.json');
        if (!fs.existsSync(dummyManifest)) {
            fs.writeFileSync(
                dummyManifest,
                JSON.stringify({
                    name: 'vscode-test-dummy',
                    version: '0.0.1',
                    private: true,
                    engines: { vscode: '^1.75.0' },
                }, null, 2)
            );
        }

        console.log(`[VSIX Test] Running smoke tests against installed VSIX...\n`);

        await runTests({
            vscodeExecutablePath,
            extensionDevelopmentPath: dummyExtensionPath,
            extensionTestsPath,
            launchArgs: [
                workspacePath,
                '--user-data-dir', userDataDir,
                '--extensions-dir', extensionsDir,
            ],
        });

        console.log(`\n[VSIX Test] ✓ Smoke tests passed. Extension works in isolated environment.\n`);

    } catch (err) {
        console.error(`\n[VSIX Test] ✗ Failed: ${err}\n`);
        process.exit(1);
    }
}

main();
