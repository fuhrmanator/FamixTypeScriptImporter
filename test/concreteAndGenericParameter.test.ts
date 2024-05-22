import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParameterType, ParameterizableClass } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/parametrizableClass.ts",
`class ClassA<V> {}

class ClassB extends ClassA<string>

`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concrete and generic parameter', () => {
    
    it("should contain a concrete and generic parameter 'V'", () => {
        const classA = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableClass") as Set<ParameterizableClass>).find(v => v.getName() === "ClassA");
        expect(classA).toBeTruthy();
        const param = classA?.getParameterTypes();
        let firstParameter = param?.values().next().value;
        expect(firstParameter?.getName()).toBe('V');
    });

});