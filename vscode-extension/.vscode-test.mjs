import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'client/dist/test/suite/**/*.test.js',
    workspaceFolder: './client/src/test/fixtures/project-with-tsconfig',
    mocha: {
        ui: 'tdd',
        timeout: 30000
    }
});
