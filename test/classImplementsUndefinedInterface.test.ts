import { Importer } from '../src/analyze';
import { Class } from '../src/lib/famix/src/model/famix/class';
import { Interface } from '../src/lib/famix/src/model/famix/interface';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/classImplementsUndefinedInterface.ts",
`import {FileSystemHost} from "ts-morph";

class myClass implements FileSystemHost {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for class implements undefined interface', () => {

    const classesSet = fmxRep._getAllEntitiesWithType("Class");
    const interfacesSet = fmxRep._getAllEntitiesWithType("Interface");
    
    it("should contain one class and one interface", () => {
        expect(classesSet.size).toBe(1);
        expect(interfacesSet.size).toBe(1);
    });

    it("should contain an interface myClass that extends an interface FileSystemHost", () => {
        const cList = Array.from(classesSet as Set<Class>);
        const iList = Array.from(interfacesSet as Set<Interface>);
        expect(cList).toBeTruthy();
        expect(iList).toBeTruthy();
        const myInterface1 = iList.find(p => p.name === "FileSystemHost");
        expect(myInterface1).toBeTruthy();
        expect(myInterface1?.isStub).toBe(true);
        const myClass = cList.find(p => p.name === "myClass");
        expect(myClass).toBeTruthy();
        if (myClass) {
            expect(myClass.subInheritances.size).toBe(0);
            expect(myClass.superInheritances.size).toBe(1);
            const theInheritance = (Array.from(myClass.superInheritances)[0]);
            expect(theInheritance.superclass).toBeTruthy();
            expect(theInheritance.superclass).toBe(myInterface1);
        }
        if (myInterface1) {
            expect(myInterface1.subInheritances.size).toBe(1);
            expect(myInterface1.superInheritances.size).toBe(0);
            const theInheritance = (Array.from(myInterface1.subInheritances)[0]);
            expect(theInheritance.subclass).toBeTruthy();
            expect(theInheritance.subclass).toBe(myClass);
        }
    });
});
