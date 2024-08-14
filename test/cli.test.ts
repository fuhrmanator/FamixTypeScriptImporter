import { execSync } from 'child_process';

const commandLineStart = 'ts-node src/ts2famix-cli.ts';

describe('ts2famix should handle command line options', () => {
    test('should show help option', () => {
        try {
            const output = execSync(commandLineStart, {
                encoding: 'utf-8',
            });
            console.info("Output: " + output);
        } catch (error) {
            console.info("Error JSON: " + JSON.stringify(error));
            expect(error.message).toContain(`--help`);
        }
    });

    test('should show that a json was produced', () => {
        const output = execSync(`${commandLineStart} -i "./test_src/**/sampleForModule.ts" -o JSONModels/temp.json`, {
            encoding: 'utf-8',
        });
        expect(output).toContain(`JSONModels/temp.json`);
    });
});
