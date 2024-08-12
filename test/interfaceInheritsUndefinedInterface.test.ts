import { Importer } from '../src/analyze';
import { Interface } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/interfaceInheritsUndefinedInterface.ts",
`import {FileSystemHost} from "ts-morph";

interface MyInterface extends FileSystemHost {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for interface inherits undefined interface', () => {

    it("should contain two interfaces", () => {
        expect(fmxRep._getAllEntitiesWithType("Interface").size).toBe(2);
    });

    it("should contain an interface MyInterface that extends an interface FileSystemHost", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("Interface") as Set<Interface>);
        expect(cList).toBeTruthy();
        const myInterface1 = cList.find(p => p.getName() === "FileSystemHost");
        expect(myInterface1).toBeTruthy();
        expect(myInterface1?.getIsStub()).toBe(true);
        const myInterface2 = cList.find(p => p.getName() === "MyInterface");
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
