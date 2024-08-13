import { Importer } from '../src/analyze';
import { ParametricInterface } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/concretisationTypeInstantiation.ts",
`
interface InterfaceE<T> {
    (param: T): void;
}

const interfaceInstance: InterfaceE<number> = { value: "example" };

class MyClass<T> {
}

function processInstance(instance: MyClass<boolean>): MyClass<boolean> {
    return instance;
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 3 generic interfaces", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(2);
    });

    it("should contain 2 generic classes", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(2);
    });

    it("should contain generic interfaces named InterfaceE", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).getName());
        expect(listOfNames).toContain("InterfaceE");
        const numberOfInterfaceE = listOfNames.filter(name => name === "InterfaceE").length;
        expect(numberOfInterfaceE).toBe(2); 
    });

    it("should contain 3 concretisations", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(2);
    });

    it("should contain two parameter concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(2);
    });

    const theInterface = fmxRep._getFamixInterface("{concretisationTypeInstantiation.ts}.InterfaceE<T>");

    it("The concrete Class should be MyClass with concreteParameter boolean", () => {
        const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation");
        const iterator = theConcretisation.values();
        const firstElement = iterator.next().value;
        expect(firstElement.concreteEntity.getName()).toBe("MyClass");
        const concParameter = firstElement.concreteEntity.concreteParameters.values().next().value;
        expect(concParameter.getName()).toBe("boolean");
    });

    it("The concrete Interface should be InterfaceE with concreteParameter number", () => {
        const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation");
        const iterator = theConcretisation.values();
        const firstElement = iterator.next().value;
        const secondElement = iterator.next().value;
        expect(secondElement.concreteEntity.getName()).toBe("InterfaceE");
        const concParameter = secondElement.concreteEntity.concreteParameters.values().next().value;
        expect(concParameter.getName()).toBe("number");
    });

});
