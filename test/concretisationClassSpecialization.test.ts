import { Importer } from '../src/analyze';
import { Concretisation, ParameterConcretisation, ParametricClass } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

// TODO: ⏳ Review if the test is still in a sync with a current solution.
//       🛠️ Fix code to pass the tests and remove .skip

const importer = new Importer();

project.createSourceFile("/concretisationClassSpecialization.ts",
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

const fmxRep = importer.famixRepFromProject(project);

describe.skip('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 6 generic classes", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(6);
    });

    it("should contain generic classes named ClassA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).name);
        expect(listOfNames).toContain("ClassA");

        const numberOfClassA = listOfNames.filter(name => name === "ClassA").length;
        expect(numberOfClassA).toBe(3); 
    });

    const theClass = fmxRep._getFamixClass("{concretisationClassSpecialization.ts}.ClassA<T>[ClassDeclaration]");

    it ("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.isAbstract).toBe(false);
    });

    it("should contain 3 concretisations", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(3);
    });

    it("The generic Class should be ClassA<T> with genericParameter T", () => {
        const theConcretisations = fmxRep._getAllEntitiesWithType("Concretisation") as Set<Concretisation>;
        const iterator = theConcretisations.values();
        const firstElement = iterator.next().value as Concretisation;
        expect(firstElement.genericEntity).toBe(theClass);
        const T = firstElement.genericEntity.genericParameters.values().next().value as ParametricClass;
        expect(T.name).toBe("T");
    });

    it.skip("should contain two parameter concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(2);
    });

    it.skip("The first parameter concretisation should contain two concretisations", () => {
        const theConcretisations = fmxRep._getAllEntitiesWithType("ParameterConcretisation") as Set<ParameterConcretisation>;
        const iterator = theConcretisations.values();
        const firstElement = iterator.next().value as ParameterConcretisation;
        expect(firstElement).toBeTruthy();
        const genericParameter = firstElement.genericParameter;
        expect(genericParameter).toBeTruthy();
        const concParameter = firstElement.concreteParameter;
        expect(concParameter).toBeTruthy();
 
        expect(genericParameter.name).toBe("T");
        expect(concParameter.name).toBe("string");
        expect(firstElement.concretisations.size).toBe(2);
    });

});
