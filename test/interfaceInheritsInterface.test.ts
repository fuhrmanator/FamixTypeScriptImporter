import { Importer } from '../src/analyze';
import { Interface } from '../src/lib/famix/src/model/famix';
import { Project } from 'ts-morph';

const importer = new Importer();

const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);
project.createSourceFile("./src/interfaceInheritsInterface.ts",
`interface MyInterface1 {}
interface MyInterface2 extends MyInterface1 {}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for interface inherits interface', () => {

    it("should contain two interfaces", () => {
        expect(fmxRep._getAllEntitiesWithType("Interface").size).toBe(2);
    });

    it("should contain an interface MyInterface2 that extends an interface MyInterface1", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("Interface") as Set<Interface>);
        expect(cList).toBeTruthy();
        const myInterface1 = cList.find(p => p.getName() === "MyInterface1");
        expect(myInterface1).toBeTruthy();
        const myInterface2 = cList.find(p => p.getName() === "MyInterface2");
        expect(myInterface2).toBeTruthy();
        if (myInterface2) {
            expect(myInterface2.getSubInheritances().size).toBe(0);
            expect(myInterface2.getSuperInheritances().size).toBe(1);
            const theInheritance = (Array.from(myInterface2.getSuperInheritances())[0]);
            expect(theInheritance.getSuperclass()).toBeTruthy();
            expect(theInheritance.getSuperclass()).toBe(myInterface1);
        }
        if (myInterface1) {
            expect(myInterface1.getSubInheritances().size).toBe(1);
            expect(myInterface1.getSuperInheritances().size).toBe(0);
            const theInheritance = (Array.from(myInterface1.getSubInheritances())[0]);
            expect(theInheritance.getSubclass()).toBeTruthy();
            expect(theInheritance.getSubclass()).toBe(myInterface2);
        }
    });
});
