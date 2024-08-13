import { Importer } from '../src/analyze';
import { Interface } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/classExtendsUndefinedClass.ts",
`import {ClassDeclaration} from "ts-morph";

class MyClass extends ClassDeclaration {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe.skip('Tests for class extends undefined class', () => {

    it("should contain two classes", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(2);
    });

    it("should contain a class MyClass that extends a class ClassDeclaration", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("Class") as Set<Interface>);
        expect(cList).toBeTruthy();
        const myClass1 = cList.find(p => p.getName() === "ClassDeclaration");
        expect(myClass1).toBeTruthy();
        expect(myClass1?.getIsStub()).toBe(true);
        const myClass2 = cList.find(p => p.getName() === "MyClass");
        expect(myClass2).toBeTruthy();
        if (myClass2) {
            expect(myClass2.subInheritances.size).toBe(0);
            expect(myClass2.superInheritances.size).toBe(1);
            const theInheritance = (Array.from(myClass2.superInheritances)[0]);
            expect(theInheritance.superclass).toBeTruthy();
            expect(theInheritance.superclass).toBe(myClass1);
        }
        if (myClass1) {
            expect(myClass1.subInheritances.size).toBe(1);
            expect(myClass1.superInheritances.size).toBe(0);
            const theInheritance = (Array.from(myClass1.subInheritances)[0]);
            expect(theInheritance.subclass).toBeTruthy();
            expect(theInheritance.subclass).toBe(myClass2);
        }
    });
});
