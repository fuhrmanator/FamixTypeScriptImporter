import { Importer } from '../src/analyze';
import { Interface } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/interfaceInheritsInterface.ts",
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
            expect(myInterface2.subInheritances.size).toBe(0);
            expect(myInterface2.superInheritances.size).toBe(1);
            const theInheritance = (Array.from(myInterface2.superInheritances)[0]);
            expect(theInheritance.superclass).toBeTruthy();
            expect(theInheritance.superclass).toBe(myInterface1);
        }
        if (myInterface1) {
            expect(myInterface1.subInheritances.size).toBe(1);
            expect(myInterface1.superInheritances.size).toBe(0);
            const theInheritance = (Array.from(myInterface1.subInheritances)[0]);
            expect(theInheritance.subclass).toBeTruthy();
            expect(theInheritance.subclass).toBe(myInterface2);
        }
    });
});
