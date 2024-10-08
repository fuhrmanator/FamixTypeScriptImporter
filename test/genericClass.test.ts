import { Importer } from '../src/analyze';
import { ParametricClass, ParameterType } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/genericClass.ts",
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
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).name);
        expect(listOfNames).toContain("MyClass");
    });

    it("should contain a generic class MyClass with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>);
        expect(pList).toBeTruthy();
        const MyClass = pList.find(p => p.name === "MyClass");
        expect(MyClass).toBeTruthy();
        expect(MyClass?.genericParameters.size).toBe(1);
        if (MyClass) {
            expect((Array.from(MyClass.genericParameters)[0] as ParameterType).name).toBe("T");
            expect((Array.from(MyClass.genericParameters)[0] as ParameterType).parentGeneric).toBe(MyClass);
        }
    });

    const theClass = fmxRep._getFamixClass("{genericClass.ts}.MyClass<T>[ClassDeclaration]");
    it ("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.isAbstract).toBe(false);
    });
});
