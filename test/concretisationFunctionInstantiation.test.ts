import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/concretisationFunctionInstantiation.ts",
`
function createInstance<T>(c: new () => T): T {
    return new c();
}

class ClassE {
    property: string = "example";
}

const instance = createInstance<ClassE>(ClassE);
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain one generic function", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricFunction").size).toBe(1);
    });

    // it("should contain generic interfaces named InterfaceE", () => {
    //     const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).getName());
    //     expect(listOfNames).toContain("InterfaceE");

    //     const numberOfInterfaceE = listOfNames.filter(name => name === "InterfaceE").length;
    //     expect(numberOfInterfaceE).toBe(3); 
    // });

    // const theInterface = fmxRep._getFamixInterface("{concretisationTypeInstantiation.ts}.InterfaceE<T>");

    // it("should contain one concretisation", () => {
    //     expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(2);
    // });

    // it("The generic interface should be InterfaceE<T> with genericParameter T", () => {
    //     const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation");
    //     const iterator = theConcretisation.values();
    //     const firstElement = iterator.next().value;
    //     expect(firstElement.getGenericEntity()).toBe(theInterface);
    //     const T = firstElement.getGenericEntity().getGenericParameters().values().next().value;
    //     expect(T.getName()).toBe("T");
    // });

    // it("The concrete Class should be InterfaceE with concreteParameter string", () => {
    //     const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation");
    //     const iterator = theConcretisation.values();
    //     const firstElement = iterator.next().value;
    //     expect(firstElement.getConcreteEntity().getName()).toBe("InterfaceE");
    //     const concParameter = firstElement.getConcreteEntity().getConcreteParameters().values().next().value;
    //     expect(concParameter.getName()).toBe("number");
    // });

    // it("should contain one parameter concretisation", () => {
    //     expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(2);
    // });
});