import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParametricClass, Concretisation, ParametricInterface } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

project.createSourceFile("/concretisationInterfaceSpecialization.ts",
`
interface InterfaceA<T> {
}

interface InterfaceB extends InterfaceA<string> {
}

interface InterfaceC extends InterfaceA<string> {
}

interface InterfaceD<U> extends InterfaceA<U> {
}

interface InterfaceE<T> {
}

interface InterfaceF extends InterfaceE<string> {
}

interface InterfaceH extends InterfaceA<string>, InterfaceE<number> {
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 6 generic interfaces", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(7);
    });

    it("should contain generic interfaces named InterfaceA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).getName());
        expect(listOfNames).toContain("InterfaceA");
        const numberOfInterfaceA = listOfNames.filter(name => name === "InterfaceA").length;
        expect(numberOfInterfaceA).toBe(3); 
    });

    it("should contain generic interfaces named InterfaceE", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).getName());
        expect(listOfNames).toContain("InterfaceE");
        const numberOfInterfaceE = listOfNames.filter(name => name === "InterfaceE").length;
        expect(numberOfInterfaceE).toBe(3); 
    });

    const theInterface = fmxRep._getFamixInterface("{concretisationInterfaceSpecialization.ts}.InterfaceA<T>");

    it("should contain 3 concretisations", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(4);
    });

    it("The generic Class should be InterfaceA<T> with genericParameter T", () => {
        const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation");
        const iterator = theConcretisation.values();
        const firstElement = iterator.next().value;
        expect(firstElement.getGenericEntity()).toBe(theInterface);
        const T = firstElement.getGenericEntity().getGenericParameters().values().next().value;
        expect(T.getName()).toBe("T");
    });

    it("The concrete Class should be InterfaceA<string> with concreteParameter string", () => {
        const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation");
        const iterator = theConcretisation.values();
        const firstElement = iterator.next().value;
        expect(firstElement.getConcreteEntity().getName()).toBe("InterfaceA");
        const concParameter = firstElement.getConcreteEntity().getConcreteParameters().values().next().value;
        expect(concParameter.getName()).toBe("string");
    });

    it("should contain two parameter concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(3);
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
