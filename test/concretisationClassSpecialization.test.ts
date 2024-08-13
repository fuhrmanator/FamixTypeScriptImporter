import { Importer } from '../src/analyze';
import { ParametricClass } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

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

describe('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 6 generic classes", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(6);
    });

    it("should contain generic classes named ClassA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).getName());
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
        const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation");
        const iterator = theConcretisation.values();
        const firstElement = iterator.next().value;
        expect(firstElement.getGenericEntity()).toBe(theClass);
        const T = firstElement.getGenericEntity().genericParameters.values().next().value;
        expect(T.getName()).toBe("T");
    });

    it("should contain two parameter concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(2);
    });

    it("The first parameter concretisation should contain two concretisations", () => {
        const theConcretisation = fmxRep._getAllEntitiesWithType("ParameterConcretisation");
        const iterator = theConcretisation.values();
        const firstElement = iterator.next().value;
        const genericParameter = firstElement.getGenericParameter();
        const concParameter = firstElement.getConcreteParameter();
        expect(genericParameter.getName()).toBe("T");
        expect(concParameter.getName()).toBe("string");
        expect(firstElement.getConcretisations().size).toBe(2);
    });

});
