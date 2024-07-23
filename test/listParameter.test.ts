import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Parameter } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);
project.createSourceFile("/listParameter.ts",
`function testMethod(list: Array<any>): Array<any> {
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for parameters in function', () => {

    it("should contain function 'testMethod'", () => {
        const theFunction = fmxRep._getFamixFunction('{listParameter.ts}.testMethod');
        expect(theFunction).toBeTruthy();
    });

    it("should contain parameter 'list'", () => {
        const theParam = Array.from(fmxRep._getAllEntitiesWithType("Parameter") as Set<Parameter>).find(v => v.getName() === "list");
        expect(theParam).toBeTruthy();
    });

});
