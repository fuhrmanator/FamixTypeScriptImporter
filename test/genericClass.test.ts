import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParametricClass, ParameterType } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/genericClass.ts",
`class MyClass<T> {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generic class', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain one generic class", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(1);
    });

    it("should contain a generic class MyClass", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).getName());
        expect(listOfNames).toContain("MyClass");
    });

    it("should contain a generic class MyClass with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>);
        expect(pList).toBeTruthy();
        const MyClass = pList.find(p => p.getName() === "MyClass");
        expect(MyClass).toBeTruthy();
        expect(MyClass?.getGenericParameters().size).toBe(1);
        if (MyClass) {
            expect((Array.from(MyClass.getGenericParameters())[0] as ParameterType).getName()).toBe("T");
            expect((Array.from(MyClass.getGenericParameters())[0] as ParameterType).getParentGeneric()).toBe(MyClass);
        }
    });

    const theClass = fmxRep._getFamixClass("{genericClass.ts}.MyClass");
    it ("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.getIsAbstract()).toBe(false);
    });
});
