import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParametricClass } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

project.createSourceFile("/parametrizableClass.ts",
`class ClassA<V> {}

class ClassB extends ClassA<string>{}

class ClassC<U> extends ClassA<U> {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concrete and generic parameter', () => {
    
    it("should contain a concrete and generic parameter ''", () => {
        const classA = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>).find(v => v.getName() === "ClassA");
        expect(classA).toBeTruthy();
        const param = classA?.getGenericParameters();
        const firstParameter = param?.values().next().value;
        expect(firstParameter?.getName()).toBe('V');
    });

    it("should contain a generic parameter 'U'", () => {
        const classC = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>).find(v => v.getName() === "ClassC");
        expect(classC).toBeTruthy();
        const param = classC?.getGenericParameters();
        const firstParameter = param?.values().next().value;
        expect(firstParameter?.getName()).toBe('U');
    });

});
