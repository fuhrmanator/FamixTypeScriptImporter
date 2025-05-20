import { Importer } from '../src/analyze';
import { Concretisation, ParametricFunction, ParametricMethod } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/src/concretisationFunctionInstantiation.ts",
`
interface CustomType {
    message: string;
}

function createInstance<T>(c: string): T {
    return c as unknown as T;
}

const instance = createInstance<CustomType>("hello");

class Processor {
    process<V>(value: V): V {
        return value;
    }
}

const processor = new Processor();

const resultString = processor.process<string>("Hello, world!");
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain two generic functions", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricFunction").size).toBe(2);
    });

    it("should contain generic functions named createInstance", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricFunction")).map(e => (e as ParametricFunction).name);
        expect(listOfNames).toContain("createInstance");

        const numberOfCreateInstance = listOfNames.filter(name => name === "createInstance").length;
        expect(numberOfCreateInstance).toBe(2); 
    });

    it("should contain two generic methods", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricMethod").size).toBe(2);
    });

    it("should contain generic methods named process", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricMethod")).map(e => (e as ParametricMethod).name);
        expect(listOfNames).toContain("process");

        const numberOfCreateInstance = listOfNames.filter(name => name === "process").length;
        expect(numberOfCreateInstance).toBe(2); 
    });

    it("should contain two concretisations", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(2);
    });

    const theInterface = fmxRep._getFamixInterface("{src/concretisationFunctionInstantiation.ts}.CustomType[InterfaceDeclaration]");

    it("The concrete Function should be createInstance with concreteParameter CustomType", () => {
        const theConcretisations = fmxRep._getAllEntitiesWithType("Concretisation") as Set<Concretisation>;
        const iterator = theConcretisations.values();
        const firstElement = iterator.next().value as Concretisation;
        expect(firstElement).toBeTruthy();
        const secondElement = iterator.next().value as Concretisation;
        expect(secondElement.concreteEntity.name).toBe("createInstance");
        const concParameter = secondElement.concreteEntity.concreteParameters.values().next().value as ParametricFunction;
        expect(concParameter).toBeTruthy();
        expect(concParameter.name).toBe(theInterface?.name);
    });

    it("The concrete Method should be process with concreteParameter string", () => {
        const theConcretisations = fmxRep._getAllEntitiesWithType("Concretisation") as Set<Concretisation>;
        const iterator = theConcretisations.values();
        const firstElement = iterator.next().value as Concretisation;
        expect(firstElement).toBeTruthy();
        expect(firstElement.concreteEntity.name).toBe("process");
        const concParameter = firstElement.concreteEntity.concreteParameters.values().next().value as ParametricMethod;
        expect(concParameter).toBeTruthy();
        expect(concParameter.name).toBe("string");
    });

    it("should contain two parameter concretisations", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(2);
    });
});
