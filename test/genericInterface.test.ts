import { Importer } from '../src/analyze';
import { ParametricInterface, ParameterType } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/genericInterface.ts",
`interface MyInterface<T> {
    myProperty;
    myMethod();
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generic interface', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain one generic interface", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(1);
    });

    it("should contain a generic interface MyInterface", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).getName());
        expect(listOfNames).toContain("MyInterface");
    });

    it("should contain a generic interface MyInterface with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface") as Set<ParametricInterface>);
        expect(pList).toBeTruthy();
        const MyInterface = pList.find(p => p.getName() === "MyInterface");
        expect(MyInterface).toBeTruthy();
        expect(MyInterface?.genericParameters.size).toBe(1);
        if (MyInterface) {
            expect((Array.from(MyInterface.genericParameters)[0] as ParameterType).getName()).toBe("T");
        }
    });
});
