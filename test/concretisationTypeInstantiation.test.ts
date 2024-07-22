import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParametricInterface } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/concretisationTypeInstantiation.ts",
`
interface InterfaceE<T> {
    (param: T): void;
}

const interfaceInstance: InterfaceE<number> = { value: "example" };

function func(param: string): InterfaceE<string> {
    return function(param: string): void {
        console.log(param);
    };
}

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
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(3);
    });

    it("should contain 2 generic classes", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(2);
    });

    it("should contain generic interfaces named InterfaceE", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).getName());
        expect(listOfNames).toContain("InterfaceE");
        const numberOfInterfaceE = listOfNames.filter(name => name === "InterfaceE").length;
        expect(numberOfInterfaceE).toBe(3); 
    });

    it("should contain 3 concretisations", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(3);
    });

    it("should contain two parameter concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(3);
    });
});