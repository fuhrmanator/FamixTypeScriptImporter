import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Class } from '../src/lib/famix/src/model/famix/class';
import { Interface } from '../src/lib/famix/src/model/famix/interface';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

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
        const myInterface1 = iList.find(p => p.getName() === "FileSystemHost");
        expect(myInterface1).toBeTruthy();
        expect(myInterface1?.getIsStub()).toBe(true);
        const myClass = cList.find(p => p.getName() === "myClass");
        expect(myClass).toBeTruthy();
        if (myClass) {
            expect(myClass.getSubInheritances().size).toBe(0);
            expect(myClass.getSuperInheritances().size).toBe(1);
            const theInheritance = (Array.from(myClass.getSuperInheritances())[0]);
            expect(theInheritance.getSuperclass()).toBeTruthy();
            expect(theInheritance.getSuperclass()).toBe(myInterface1);
        }
        if (myInterface1) {
            expect(myInterface1.getSubInheritances().size).toBe(1);
            expect(myInterface1.getSuperInheritances().size).toBe(0);
            const theInheritance = (Array.from(myInterface1.getSubInheritances())[0]);
            expect(theInheritance.getSubclass()).toBeTruthy();
            expect(theInheritance.getSubclass()).toBe(myClass);
        }
    });
});
