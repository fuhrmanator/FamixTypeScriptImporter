import * as path from 'path';
import * as fs from 'fs';

export function run(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Mocha = require(path.resolve(__dirname, '../../../node_modules/mocha'));
    const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 30000 });
    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((c, e) => {
        try {
            const testFiles = findTestFiles(testsRoot);
            testFiles.forEach(f => mocha.addFile(f));
            mocha.run((failures: number) => {
                failures > 0 ? e(new Error(`${failures} tests failed.`)) : c();
            });
        } catch (err) {
            e(err);
        }
    });
}

function findTestFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...findTestFiles(fullPath));
        else if (entry.name.endsWith('.test.js')) results.push(fullPath);
    }
    return results;
}