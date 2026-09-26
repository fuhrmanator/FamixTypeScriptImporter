import { Importer } from '../src/analyze';
import { Concretization, ParametricInheritance, ParametricInterface } from '../src/lib/famix/model/famix';
import { project, exportProjectSourceFilesForEndtoEndPharoTests } from './testUtils';

const importer = new Importer();

project.createSourceFile("concretizationInterfaceClass.ts",
`
interface InterfaceD<T> {
}

class ClassG implements InterfaceD<number> {
}
`);

exportProjectSourceFilesForEndtoEndPharoTests(project, __filename);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretization', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 1 generic interface", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(1);
    });

    it("should contain a single generic interface named InterfaceD", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).name);
        expect(listOfNames).toContain("InterfaceD");

        const numberOfInterfaceD = listOfNames.filter(name => name === "InterfaceD").length;
        expect(numberOfInterfaceD).toBe(1);
    });

    it("should contain one concretization", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretization").size).toBe(1);
    });

    it("should contain a concretization of InterfaceD's type parameter T with number", () => {
        const theConcretizations = fmxRep._getAllEntitiesWithType("Concretization") as Set<Concretization>;
        const theConcretization = theConcretizations.values().next().value as Concretization;
        expect(theConcretization.typeParameter.name).toBe("T");
        expect(theConcretization.typeArgument.name).toBe("number");
    });

    it("should contain one ParametricInheritance for `class ClassG implements InterfaceD<number>`", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricInheritance").size).toBe(1);
    });

    it("should link ClassG's ParametricInheritance from InterfaceD to its own concretization", () => {
        const inheritances = Array.from(fmxRep._getAllEntitiesWithType("ParametricInheritance") as Set<ParametricInheritance>);
        const classGInheritance = inheritances[0];
        expect(classGInheritance).toBeTruthy();
        expect(classGInheritance.subclass.name).toBe("ClassG");
        expect(classGInheritance.superclass.name).toBe("InterfaceD");

        const ownConcretizations = Array.from(classGInheritance.concretizations);
        expect(ownConcretizations.length).toBe(1);
        expect(ownConcretizations[0].typeParameter.name).toBe("T");
        expect(ownConcretizations[0].typeArgument.name).toBe("number");
    });

});
