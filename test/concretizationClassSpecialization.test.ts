import { Importer } from '../src/analyze';
import { Concretization, ParametricClass, ParametricInheritance } from '../src/lib/famix/model/famix';
import { project, exportProjectSourceFilesForEndtoEndPharoTests } from './testUtils';

const importer = new Importer();

project.createSourceFile("concretizationClassSpecialization.ts",
`class ClassA<T> {
}

class ClassB extends ClassA<string> {
}

class ClassC extends ClassA<string> {
}

class ClassD<U> extends ClassA<U> {
}

class ClassE<T> {
}

class ClassF extends ClassE<string> {
}
`);

exportProjectSourceFilesForEndtoEndPharoTests(project, __filename);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretization', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 3 generic classes", () => {
        // ClassA, ClassD and ClassE declare their own type parameters.
        // ClassB, ClassC and ClassF are plain (non-generic) subclasses, not ParametricClass.
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(3);
    });

    it("should contain a single generic class named ClassA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).name);
        expect(listOfNames).toContain("ClassA");

        const numberOfClassA = listOfNames.filter(name => name === "ClassA").length;
        expect(numberOfClassA).toBe(1);
    });

    const theClass = fmxRep._getFamixClass("{concretizationClassSpecialization.ts}.ClassA<T>[ClassDeclaration]");

    it ("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.isAbstract).toBe(false);
    });

    it("should contain 4 concretizations", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretization").size).toBe(4);
    });

    it("should contain a concretization of ClassA's type parameter T with string", () => {
        const theConcretizations = Array.from(fmxRep._getAllEntitiesWithType("Concretization"));
        const concretizationOfClassA = theConcretizations.find(c => c.typeParameter.genericEntity === theClass && c.typeArgument.name === "string");
        expect(concretizationOfClassA).toBeTruthy();
        expect(concretizationOfClassA?.typeParameter.name).toBe("T");
    });

    it("should contain 4 ParametricInheritance associations, one per subclass extending a generic superclass", () => {
        // ClassB -> ClassA, ClassC -> ClassA, ClassD -> ClassA, ClassF -> ClassE.
        expect(fmxRep._getAllEntitiesWithType("ParametricInheritance").size).toBe(4);
    });

    it("should link ClassB's ParametricInheritance from ClassA to its own concretization", () => {
        const inheritances = Array.from(fmxRep._getAllEntitiesWithType("ParametricInheritance"));
        const classBInheritance = inheritances.find(i => i.subclass.name === "ClassB");
        expect(classBInheritance).toBeTruthy();
        expect(classBInheritance?.superclass).toBe(theClass);

        const ownConcretizations = Array.from(classBInheritance?.concretizations ?? []);
        expect(ownConcretizations.length).toBe(1);
        expect(ownConcretizations[0].typeParameter.name).toBe("T");
        expect(ownConcretizations[0].typeArgument.name).toBe("string");
        expect(ownConcretizations[0].triggeringAssociation).toBe(classBInheritance);
    });

});
