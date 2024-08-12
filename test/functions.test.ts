import { Importer } from '../src/analyze';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/functions.ts",
`function a() {}
function b() {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Functions', () => {

    it("should contain function 'a'", () => {
        const theFunction = fmxRep._getFamixFunction('{functions.ts}.a[FunctionDeclaration]');
        expect(theFunction).toBeTruthy();
    });

    it("should contain function 'b'", () => {
        const theFunction = fmxRep._getFamixFunction('{functions.ts}.b[FunctionDeclaration]');
        expect(theFunction).toBeTruthy();
    });
});
