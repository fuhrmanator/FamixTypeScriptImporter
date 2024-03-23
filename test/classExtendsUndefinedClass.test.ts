import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Interface } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/classExtendsUndefinedClass.ts",
`import {ClassDeclaration} from "ts-morph";

class MyClass extends ClassDeclaration {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for class extends undefined class', () => {

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
            expect(myClass2.getSubInheritances().size).toBe(0);
            expect(myClass2.getSuperInheritances().size).toBe(1);
            const theInheritance = (Array.from(myClass2.getSuperInheritances())[0]);
            expect(theInheritance.getSuperclass()).toBeTruthy();
            expect(theInheritance.getSuperclass()).toBe(myClass1);
        }
        if (myClass1) {
            expect(myClass1.getSubInheritances().size).toBe(1);
            expect(myClass1.getSuperInheritances().size).toBe(0);
            const theInheritance = (Array.from(myClass1.getSubInheritances())[0]);
            expect(theInheritance.getSubclass()).toBeTruthy();
            expect(theInheritance.getSubclass()).toBe(myClass2);
        }
    });
});
