import { Importer } from '../src/analyze';
import { Type } from '../src/lib/famix/src/model/famix/type';
import { Class } from '../src/lib/famix/src/model/famix/class';
import { Project } from 'ts-morph';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

project.createSourceFile("/namespacesAndClasses.ts",
`namespace MyNamespace {
	class EntityClass {}
	class class2 {}
}

class clsOutNsp {}

namespace Nsp3 {
	class clsInNsp3 {}
}
`);


const fmxRep = importer.famixRepFromProject(project);

describe('Tests for namespaces and classes', () => {
    
    it("should contain two namespaces", () => {
        expect(fmxRep._getFamixModules().size).toBe(2);
    });

    const theFile = fmxRep._getFamixFile("namespacesAndClasses.ts");
    const theNamespace1 = fmxRep._getFamixModule("{namespacesAndClasses.ts}.MyNamespace");
    it("should contain a namespace MyNamespace", () => {
        expect(theNamespace1).toBeTruthy();
        expect(theNamespace1?.getParentScope()).toBe(theFile);
    });

    it("should contain two classes", () => {
        expect(Array.from(theNamespace1?.getTypes() as Set<Type>).filter(t => (t instanceof Class)).length).toBe(2);
    });

    const theNamespace2 = fmxRep._getFamixModule("{namespacesAndClasses.ts}.Nsp3");
    it("should contain a namespace Nsp3", () => {
        expect(theNamespace2).toBeTruthy();
        expect(theNamespace2?.getParentScope()).toBe(theFile);
    });
    
    it("should contain one class", () => {
        expect(Array.from(theNamespace2?.getTypes() as Set<Type>).filter(t => (t instanceof Class)).length).toBe(1);
    });

    it("should contain four classes", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(4);
    });

    it("should contain a class EntityClass", () => {
        expect(fmxRep._getFamixClass("{namespacesAndClasses.ts}.MyNamespace.EntityClass")).toBeTruthy();
    });

    it("should contain a class class2", () => {
        expect(fmxRep._getFamixClass("{namespacesAndClasses.ts}.MyNamespace.class2")).toBeTruthy();
    });

    it("should contain a class clsInNsp3", () => {
        expect(fmxRep._getFamixClass("{namespacesAndClasses.ts}.Nsp3.clsInNsp3")).toBeTruthy();
    });

    it("should contain a class clsOutNsp", () => {
        expect(fmxRep._getFamixClass("{namespacesAndClasses.ts}.clsOutNsp")).toBeTruthy();
    });
});
