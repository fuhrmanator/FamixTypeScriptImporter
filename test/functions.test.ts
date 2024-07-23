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
project.createSourceFile("/functions.ts",
`function a() {}
function b() {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Functions', () => {

    it("should contain function 'a'", () => {
        const theFunction = fmxRep._getFamixFunction('{functions.ts}.a');
        expect(theFunction).toBeTruthy();
    });

    it("should contain function 'b'", () => {
        const theFunction = fmxRep._getFamixFunction('{functions.ts}.b');
        expect(theFunction).toBeTruthy();
    });
});
