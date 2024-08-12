import { Importer } from '../src/analyze';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/javaScript.js",
`class A {}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for JavaScript source (not TypeScript)', () => {
    it('should return a fmxRep', () => {
        expect(fmxRep).toBeDefined();
    });
});
