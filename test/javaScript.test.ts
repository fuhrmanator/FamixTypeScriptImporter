import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

project.createSourceFile("/javaScript.js",
`class A {}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for JavaScript source (not TypeScript)', () => {
    it('should return a fmxRep', () => {
        expect(fmxRep).toBeDefined();
    });
});
