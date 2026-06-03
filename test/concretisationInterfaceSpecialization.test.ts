import { Importer } from '../src/analyze';
import { Concretisation, ParameterConcretisation, ParametricInterface } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

// TODO: ⏳ Review if the test is still in a sync with a current solution.
//       🛠️ Fix code to pass the tests and remove .skip

const importer = new Importer();

project.createSourceFile("/concretisationInterfaceSpecialization.ts",
`
interface InterfaceA<T> {
}

interface InterfaceB extends InterfaceA<string> {
}

interface InterfaceF extends InterfaceA<string> {
}

interface InterfaceD<U> extends InterfaceA<U> {
}

interface InterfaceE<T> {
}

interface InterfaceH extends InterfaceE<string> {
}

interface InterfaceH extends InterfaceE<number> , InterfaceA<number> {
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe.skip('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 8 generic interfaces", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(8);
    });

    it("should contain generic interfaces named InterfaceA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).name);
        expect(listOfNames).toContain("InterfaceA");
        const numberOfInterfaceA = listOfNames.filter(name => name === "InterfaceA").length;
        expect(numberOfInterfaceA).toBe(4); 
    });

    it("should contain generic interfaces named InterfaceE", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).name);
        expect(listOfNames).toContain("InterfaceE");
        const numberOfInterfaceE = listOfNames.filter(name => name === "InterfaceE").length;
        expect(numberOfInterfaceE).toBe(3); 
    });

    const theInterface = fmxRep._getFamixInterface("{concretisationInterfaceSpecialization.ts}.InterfaceA<T>[InterfaceDeclaration]");

    it("should contain 3 concretisations", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(5);
    });

    it("The generic Class should be InterfaceA<T> with genericParameter T", () => {
        const theConcretisations = fmxRep._getAllEntitiesWithType("Concretisation") as Set<Concretisation>;
        const iterator = theConcretisations.values();
        const firstElement = iterator.next().value as Concretisation;
        expect(firstElement.genericEntity).toBe(theInterface);
        const T = firstElement.genericEntity.genericParameters.values().next().value as ParametricInterface;
        expect(T).toBeTruthy();
        expect(T.name).toBe("T");
    });

    it.skip("The concrete Class should be InterfaceA<string> with concreteParameter string", () => {
        const theConcretisations = fmxRep._getAllEntitiesWithType("Concretisation") as Set<Concretisation>;
        const iterator = theConcretisations.values();
        const firstElement = iterator.next().value as Concretisation;
        expect(firstElement.concreteEntity.name).toBe("InterfaceA");
        const concParameter = firstElement.concreteEntity.concreteParameters.values().next().value as ParametricInterface;
        expect(concParameter).toBeTruthy();
        expect(concParameter.name).toBe("string");
    });

    it.skip("should contain two parameter concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(3);
    });

    it.skip("The first parameter concretisation should contain two concretisations", () => {
        const theConcretisation = fmxRep._getAllEntitiesWithType("ParameterConcretisation") as Set<ParameterConcretisation>;
        const iterator = theConcretisation.values();
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
