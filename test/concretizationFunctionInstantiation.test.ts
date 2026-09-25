import { Importer } from '../src/analyze';
import { Concretization, ParametricFunction, ParametricInvocation, ParametricMethod } from '../src/lib/famix/model/famix';
import { project, exportProjectSourceFilesForEndtoEndPharoTests } from './testUtils';

const importer = new Importer();

project.createSourceFile("src/concretizationFunctionInstantiation.ts",
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

exportProjectSourceFilesForEndtoEndPharoTests(project, __filename);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretization', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain one generic function", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricFunction").size).toBe(1);
    });

    it("should contain a single generic function named createInstance", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricFunction")).map(e => (e as ParametricFunction).name);
        expect(listOfNames).toContain("createInstance");

        const numberOfCreateInstance = listOfNames.filter(name => name === "createInstance").length;
        expect(numberOfCreateInstance).toBe(1);
    });

    it("should contain one generic method", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricMethod").size).toBe(1);
    });

    it("should contain a single generic method named process", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricMethod")).map(e => (e as ParametricMethod).name);
        expect(listOfNames).toContain("process");

        const numberOfProcess = listOfNames.filter(name => name === "process").length;
        expect(numberOfProcess).toBe(1);
    });

    it("should contain two concretizations", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretization").size).toBe(2);
    });

    it("should contain a concretization of createInstance's type parameter T with CustomType", () => {
        const theConcretizations = Array.from(fmxRep._getAllEntitiesWithType("Concretization") as Set<Concretization>);
        const concretizationOfCreateInstance = theConcretizations.find(c => c.typeArgument.name === "CustomType");
        expect(concretizationOfCreateInstance).toBeTruthy();
        expect(concretizationOfCreateInstance?.typeParameter.name).toBe("T");
    });

    it("should contain a concretization of process's type parameter V with string", () => {
        const theConcretizations = Array.from(fmxRep._getAllEntitiesWithType("Concretization") as Set<Concretization>);
        const concretizationOfProcess = theConcretizations.find(c => c.typeParameter.name === "V");
        expect(concretizationOfProcess).toBeTruthy();
        expect(concretizationOfProcess?.typeArgument.name).toBe("string");
    });

    it("should contain two ParametricInvocation associations", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricInvocation").size).toBe(2);
    });

    it("should record the ParametricInvocation for the createInstance<CustomType> call", () => {
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("ParametricInvocation") as Set<ParametricInvocation>);
        const createInstanceInvocation = invocations.find(inv => Array.from(inv.candidates).some(c => c.name === "createInstance"));
        expect(createInstanceInvocation).toBeTruthy();
        expect(createInstanceInvocation?.sender).toBeTruthy();
        expect(createInstanceInvocation?.signature).toBeTruthy();

        const ownConcretizations = Array.from(createInstanceInvocation?.concretizations ?? []);
        expect(ownConcretizations.length).toBe(1);
        expect(ownConcretizations[0].typeParameter.name).toBe("T");
        expect(ownConcretizations[0].typeArgument.name).toBe("CustomType");
    });

    it("should record the ParametricInvocation for the processor.process<string> call", () => {
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("ParametricInvocation") as Set<ParametricInvocation>);
        const processInvocation = invocations.find(inv => Array.from(inv.candidates).some(c => c.name === "process"));
        expect(processInvocation).toBeTruthy();
        expect(processInvocation?.receiver.name).toBe("Processor");

        const ownConcretizations = Array.from(processInvocation?.concretizations ?? []);
        expect(ownConcretizations.length).toBe(1);
        expect(ownConcretizations[0].typeParameter.name).toBe("V");
        expect(ownConcretizations[0].typeArgument.name).toBe("string");
    });

});
