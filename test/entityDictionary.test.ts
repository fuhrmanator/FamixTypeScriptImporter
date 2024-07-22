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

project.createSourceFile("/famixMorphObject.ts",
`
class Class1 {
    public returnHi(): string {
        return "Hi";
    }

    m(param) {
        var z = param;
        console.log(b);
    }
}

function a() {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for famix objects and ts-morph objects', () => {

    it("should contain 11 elements", () => {
        expect(fmxRep.getFmxElementObjectMap().size).toBe(11);
    });

});
