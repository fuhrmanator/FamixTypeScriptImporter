import { Importer } from '../src/analyze';
import { Concretization, ParametricInheritance, ParametricInterface } from '../src/lib/famix/model/famix';
import { project, exportProjectSourceFilesForEndtoEndPharoTests } from './testUtils';

const importer = new Importer();

project.createSourceFile("concretizationInterfaceSpecialization.ts",
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

exportProjectSourceFilesForEndtoEndPharoTests(project, __filename);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretization', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 3 generic interfaces", () => {
        // InterfaceA, InterfaceD and InterfaceE declare their own type parameters.
        // InterfaceB, InterfaceF and the merged InterfaceH are plain (non-generic) interfaces.
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(3);
    });

    it("should contain a single generic interface named InterfaceA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).name);
        expect(listOfNames).toContain("InterfaceA");
        const numberOfInterfaceA = listOfNames.filter(name => name === "InterfaceA").length;
        expect(numberOfInterfaceA).toBe(1);
    });

    it("should contain a single generic interface named InterfaceE", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).name);
        expect(listOfNames).toContain("InterfaceE");
        const numberOfInterfaceE = listOfNames.filter(name => name === "InterfaceE").length;
        expect(numberOfInterfaceE).toBe(1);
    });

    const theInterface = fmxRep._getFamixInterface("{concretizationInterfaceSpecialization.ts}.InterfaceA<T>[InterfaceDeclaration]");

    it("should contain 6 concretizations", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretization").size).toBe(6);
    });

    it("should contain a concretization of InterfaceA's type parameter T with string", () => {
        const theConcretizations = Array.from(fmxRep._getAllEntitiesWithType("Concretization") as Set<Concretization>);
        const concretizationOfInterfaceA = theConcretizations.find(c => c.typeParameter.genericEntity === theInterface && c.typeArgument.name === "string");
        expect(concretizationOfInterfaceA).toBeTruthy();
        expect(concretizationOfInterfaceA?.typeParameter.name).toBe("T");
    });

    it("should contain 6 ParametricInheritance associations", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricInheritance").size).toBe(6);
    });

    it("should link InterfaceB's ParametricInheritance from InterfaceA to its own concretization", () => {
        const inheritances = Array.from(fmxRep._getAllEntitiesWithType("ParametricInheritance"));
        const interfaceBInheritance = inheritances.find(i => i.subclass.name === "InterfaceB");
        expect(interfaceBInheritance).toBeTruthy();
        expect(interfaceBInheritance?.superclass).toBe(theInterface);

        const ownConcretizations = Array.from(interfaceBInheritance?.concretizations);
        expect(ownConcretizations.length).toBe(1);
        expect(ownConcretizations[0].typeParameter.name).toBe("T");
        expect(ownConcretizations[0].typeArgument.name).toBe("string");
    });

    it("should record two separate ParametricInheritance for the merged InterfaceH declaration", () => {
        // InterfaceH extends InterfaceE<string> in its first declaration, then is merged with
        // `extends InterfaceE<number>, InterfaceA<number>`: each extended generic interface gets
        // its own ParametricInheritance, so InterfaceH ends up with 3 in total.
        const inheritances = Array.from(fmxRep._getAllEntitiesWithType("ParametricInheritance"));
        const interfaceHInheritances = inheritances.filter(i => i.subclass.name === "InterfaceH");
        expect(interfaceHInheritances.length).toBe(3);

        const superclassNames = interfaceHInheritances.map(i => i.superclass.name).sort();
        expect(superclassNames).toEqual(["InterfaceA", "InterfaceE", "InterfaceE"]);
    });

});
