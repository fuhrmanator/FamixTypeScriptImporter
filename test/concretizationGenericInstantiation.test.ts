import { Importer } from '../src/analyze';
import {
    Concretization,
    ParametricClass,
    ParametricInvocation
} from '../src/lib/famix/model/famix';
import {
    project,
    exportProjectSourceFilesForEndtoEndPharoTests
} from './testUtils';

const importer = new Importer();

project.createSourceFile(
    "concretizationGenericInstantiation.ts",
    `
class ClassA<T> {
    property: T;

    constructor(value: T) {
        this.property = value;
    }
}

const instanceA = new ClassA<number>(42);

class ClassB<T, U> {
    property1: T;
    property2: U;

    constructor(value1: T, value2: U) {
        this.property1 = value1;
        this.property2 = value2;
    }
}

const instanceB = new ClassB<number, string>(42, "Hello");
`
);

exportProjectSourceFilesForEndtoEndPharoTests(project, __filename);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretization', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 2 generic classes", () => {
        expect(
            fmxRep._getAllEntitiesWithType("ParametricClass").size
        ).toBe(2);
    });

    it("should contain a single generic class named ClassA", () => {
        const listOfNames = Array.from(
            fmxRep._getAllEntitiesWithType("ParametricClass")
        ).map(e => (e as ParametricClass).name);

        expect(listOfNames).toContain("ClassA");

        const numberOfClassA =
            listOfNames.filter(name => name === "ClassA").length;

        expect(numberOfClassA).toBe(1);
    });

    it("should contain a single generic class named ClassB", () => {
        const listOfNames = Array.from(
            fmxRep._getAllEntitiesWithType("ParametricClass")
        ).map(e => (e as ParametricClass).name);

        expect(listOfNames).toContain("ClassB");

        const numberOfClassB =
            listOfNames.filter(name => name === "ClassB").length;

        expect(numberOfClassB).toBe(1);
    });

    const classA = fmxRep._getFamixClass(
        "{concretizationGenericInstantiation.ts}.ClassA<T>[ClassDeclaration]"
    );

    const classB = fmxRep._getFamixClass(
        "{concretizationGenericInstantiation.ts}.ClassB<T, U>[ClassDeclaration]" //
    );

    it("should not contain abstract classes", () => {
        expect(classA).toBeTruthy();
        expect(classB).toBeTruthy();

        if (classA) expect(classA.isAbstract).toBe(false);
        if (classB) expect(classB.isAbstract).toBe(false);
    });

    /*
     * ClassA<T>
     */

    it("should contain a concretization of ClassA's type parameter T with number", () => {
        const concretizations = Array.from(
            fmxRep._getAllEntitiesWithType("Concretization") as Set<Concretization>
        );

        const classAConcretizations = concretizations.filter(
            concretization =>
                concretization.typeParameter.genericEntity === classA
        );

        expect(classAConcretizations.length).toBe(1);

        expect(classAConcretizations[0].typeParameter.name).toBe("T");
        expect(classAConcretizations[0].typeArgument.name).toBe("number");
    });

    /*
     * ClassB<T, U>
     */

    it("should contain two concretizations for ClassB", () => {
        const concretizations = Array.from(
            fmxRep._getAllEntitiesWithType("Concretization") as Set<Concretization>
        );

        const classBConcretizations = concretizations.filter(
            concretization =>
                concretization.typeParameter.genericEntity === classB
        );

        expect(classBConcretizations.length).toBe(2);
    });

    it("should concretize ClassB's T with number and U with string", () => {
        const concretizations = Array.from(
            fmxRep._getAllEntitiesWithType("Concretization") as Set<Concretization>
        );

        const classBConcretizations = concretizations.filter(
            concretization =>
                concretization.typeParameter.genericEntity === classB
        );

        const concretizationT = classBConcretizations.find(
            concretization =>
                concretization.typeParameter.name === "T"
        );

        const concretizationU = classBConcretizations.find(
            concretization =>
                concretization.typeParameter.name === "U"
        );

        expect(concretizationT).toBeTruthy();
        expect(concretizationU).toBeTruthy();

        expect(concretizationT?.typeArgument.name).toBe("number");
        expect(concretizationU?.typeArgument.name).toBe("string");
    });

    /*
     * ParametricInvocations
     */

    it("should contain two ParametricInvocations", () => {
        expect(
            fmxRep._getAllEntitiesWithType("ParametricInvocation").size
        ).toBe(2);
    });

    it("should contain the correct ParametricInvocation for ClassA", () => {
        const invocations = Array.from(
            fmxRep._getAllEntitiesWithType(
                "ParametricInvocation"
            ) as Set<ParametricInvocation>
        );

        const classAInvocation = invocations.find(
            invocation => invocation.receiver === classA
        );

        expect(classAInvocation).toBeTruthy();

        if (!classAInvocation) return;

        expect(classAInvocation.sender).toBeTruthy();
        expect(classAInvocation.signature).toBeTruthy();

        const candidates = Array.from(classAInvocation.candidates);

        expect(candidates.length).toBe(1);
        expect(candidates[0].name).toBe("constructor");

        const ownConcretizations =
            Array.from(classAInvocation.concretizations);

        expect(ownConcretizations.length).toBe(1);
        expect(ownConcretizations[0].typeParameter.name).toBe("T");
        expect(ownConcretizations[0].typeArgument.name).toBe("number");
    });

    it("should contain the correct ParametricInvocation for ClassB", () => {
        const invocations = Array.from(
            fmxRep._getAllEntitiesWithType(
                "ParametricInvocation"
            ) as Set<ParametricInvocation>
        );

        const classBInvocation = invocations.find(
            invocation => invocation.receiver === classB
        );

        expect(classBInvocation).toBeTruthy();

        if (!classBInvocation) return;

        expect(classBInvocation.sender).toBeTruthy();
        expect(classBInvocation.signature).toBeTruthy();

        const candidates = Array.from(classBInvocation.candidates);

        expect(candidates.length).toBe(1);
        expect(candidates[0].name).toBe("constructor");

        const ownConcretizations =
            Array.from(classBInvocation.concretizations);

        expect(ownConcretizations.length).toBe(2);

        const concretizationT = ownConcretizations.find(
            concretization =>
                concretization.typeParameter.name === "T"
        );

        const concretizationU = ownConcretizations.find(
            concretization =>
                concretization.typeParameter.name === "U"
        );

        expect(concretizationT).toBeTruthy();
        expect(concretizationU).toBeTruthy();

        expect(concretizationT?.typeArgument.name).toBe("number");
        expect(concretizationU?.typeArgument.name).toBe("string");
    });
});