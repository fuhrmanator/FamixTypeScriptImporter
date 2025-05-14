import { Importer } from '../src/analyze';
import { Interface } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/interfaceInheritsUndefinedInterface.ts",
`import {FileSystemHost} from "ts-morph";

interface MyInterface extends FileSystemHost {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for interface inherits undefined interface', () => {

    it("should contain an imported interface FileSystemHost", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("Interface") as Set<Interface>);
        expect(cList).toBeTruthy();
        const myInterface = cList.find(p => p.name === "FileSystemHost");
        expect(myInterface).toBeTruthy();
        expect(myInterface?.isStub).toBe(true);
    });

    it("should contain an interface MyInterface that extends an interface FileSystemHost", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("Interface") as Set<Interface>);
        expect(cList).toBeTruthy();
        const myInterface1 = cList.find(p => p.name === "FileSystemHost");
        expect(myInterface1).toBeTruthy();
        expect(myInterface1?.isStub).toBe(true);
        const myInterface2 = cList.find(p => p.name === "MyInterface");
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

    it("should contain two interfaces", () => {
        expect(fmxRep._getAllEntitiesWithType("Interface").size).toBe(2);
    });

});
