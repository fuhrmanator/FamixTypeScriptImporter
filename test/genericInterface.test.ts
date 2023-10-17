import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParameterizableInterface, ParameterType } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project();

project.createSourceFile("genericInterface.ts",
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
        expect(fmxRep._getAllEntitiesWithType("ParameterizableInterface").size).toBe(1);
    });

    it("should contain a generic interface MyInterface", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableInterface")).map(e => (e as ParameterizableInterface).getName());
        expect(listOfNames).toContain("MyInterface");
    });

    it("should contain a generic interface MyInterface with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableInterface") as Set<ParameterizableInterface>);
        expect(pList).toBeTruthy();
        const MyInterface = pList.find(p => p.getName() === "MyInterface");
        expect(MyInterface).toBeTruthy();
        expect(MyInterface?.getParameterTypes().size).toBe(1);
        if (MyInterface) {
            expect((Array.from(MyInterface.getParameterTypes())[0] as ParameterType).getName()).toBe("T");
        }
    });
});
