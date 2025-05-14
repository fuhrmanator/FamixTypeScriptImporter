import { Importer } from '../src/analyze';
import { Class } from '../src/lib/famix/model/famix/class';
import { Interface } from '../src/lib/famix/model/famix/interface';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/classImplementsUndefinedInterface.ts",
    `import { FileSystemHost } from "ts-morph";

class MyClass implements FileSystemHost {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for class implements undefined interface', () => {

    let myClass: Class | undefined;
    let myInterface: Interface | undefined;

    it("should contain a class MyClass", () => {
        myClass = fmxRep._getFamixClass("{classImplementsUndefinedInterface.ts}.MyClass[ClassDeclaration]");
        expect(myClass).toBeTruthy();
    });

    it("should contain an interface FileSystemHost", () => {
        myInterface = fmxRep._getFamixInterface("{module:ts-morph}.FileSystemHost[InterfaceDeclaration]");
        expect(myInterface).toBeTruthy();
    });

    it("MyClass should have no sub classes", () => {
        expect(myClass?.subInheritances.size).toBe(0);
    });

    it("MyClass should have one superInheritance", () => {
        expect(myClass?.superInheritances.size).toBe(1);
    });

    it("MyClass should have one superInheritance", () => {
        expect(myClass?.superInheritances.size).toBe(1);
    });

    it("MyClass should have one superIneritance of FileSystemHost", () => {
        expect(myClass).toBeTruthy();
        expect(myInterface).toBeTruthy();
        if (myClass) {
            const theInheritance = (Array.from(myClass.superInheritances)[0]);
            expect(theInheritance.superclass).toBeTruthy();
            expect(theInheritance.superclass).toBe(myInterface);
        }
    });


    //     if (myClass) {
    //         expect(myClass.subInheritances.size).toBe(0);
    //         expect(myClass.superInheritances.size).toBe(1);
    //         const theInheritance = (Array.from(myClass.superInheritances)[0]);
    //         expect(theInheritance.superclass).toBeTruthy();
    //         expect(theInheritance.superclass).toBe(myInterface);
    //     }
    // });

    it("FileSystemHost should have one implementation", () => {
        if (myInterface) {
            expect(myInterface.subInheritances.size).toBe(1);
        }
    });
    it("FileSystemHost should have no parent interface", () => {
        if (myInterface) {
            expect(myInterface.superInheritances.size).toBe(0);
        }
    });
    it("FileSystemHost should have one implementation that is MyClass", () => {
        if (myInterface) {
            const theInheritance = (Array.from(myInterface.subInheritances)[0]);
            expect(theInheritance.subclass).toBeTruthy();
            expect(theInheritance.subclass).toBe(myClass);
        }
    });

});
