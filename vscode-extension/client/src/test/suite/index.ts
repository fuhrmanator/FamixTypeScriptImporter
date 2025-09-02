import * as path from 'path';
import Mocha from 'mocha';
import * as glob from 'glob';

// https://code.visualstudio.com/api/working-with-extensions/testing-extension#the-test-runner-script
export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((c, e) => {
        const testFiles = new glob.Glob("**/**.test.js", { cwd: testsRoot });
        const testFileStream = testFiles.stream();

        testFileStream.on("data", (file) => {
            if (process.env.MOCHA_GREP) {
                const filterPattern = new RegExp(process.env.MOCHA_GREP);
                if (!filterPattern.test(file)) {
                    return;
                }
            }
            mocha.addFile(path.resolve(testsRoot, file));
        });
    
        testFileStream.on("end", () => {
            try {
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }
        });
    });
}
