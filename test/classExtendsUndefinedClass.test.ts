import { Importer } from '../src/analyze';
import { Class } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/classExtendsUndefinedClass.ts",
`import {BaseClass} from "ts-morph";

class MyClass extends BaseClass {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for class extends unresolved (stub) class', () => {

    let baseClass: Class | undefined;
    let myClass: Class | undefined;
    
    it("should contain BaseClass", () => {
        baseClass = fmxRep._getFamixClass("{module:ts-morph}.BaseClass[ClassDeclaration]");
        expect(baseClass).toBeTruthy();
    });

    it("should contain MyClass", () => {
        myClass = fmxRep._getFamixClass("{classExtendsUndefinedClass.ts}.MyClass[ClassDeclaration]");
        expect(myClass).toBeTruthy();
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

    it("MyClass should have one superInheritance of ClassDeclaration", () => {
        expect(myClass).toBeTruthy();
        expect(baseClass).toBeTruthy();
        if (myClass) {
            const theInheritance = (Array.from(myClass.superInheritances)[0]);
            expect(theInheritance.superclass).toBeTruthy();
            expect(theInheritance.superclass).toBe(baseClass);
        } else {
            throw new Error("MyClass is undefined");
        }
    });

    it("BaseClass should have one subclass", () => {
        if (baseClass) {
            expect(baseClass.subInheritances.size).toBe(1);
        } else {
            throw new Error("BaseClass is undefined");
        }
    });

    it("BaseClass should have no super class", () => {
        if (baseClass) {
            expect(baseClass.superInheritances.size).toBe(0);
        }
    });
    it("BaseClass should have one implementation that is MyClass", () => {
        if (baseClass) {
            const theInheritance = (Array.from(baseClass.subInheritances)[0]);
            expect(theInheritance.subclass).toBeTruthy();
            expect(theInheritance.subclass).toBe(myClass);
        } else {
            throw new Error("BaseClass is undefined");
        }
    });

});
