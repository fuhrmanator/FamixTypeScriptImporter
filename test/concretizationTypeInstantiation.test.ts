import { Importer } from "../src/analyze";
import {
  Concretization,
  ParametricEntityTyping,
  ParametricInterface,
} from "../src/lib/famix/model/famix";
import {
  project,
  exportProjectSourceFilesForEndtoEndPharoTests,
} from "./testUtils";

const importer = new Importer();

project.createSourceFile(
  "concretizationTypeInstantiation.ts",
  `
interface InterfaceE<T> {
    (param: T): void;
}

const interfaceInstance: InterfaceE<number> = { value: "example" };

class MyClass<V> {
}

function processInstance(instance: MyClass<boolean>): MyClass<boolean> {
    return instance;
}

function genericFunction<T, U>(first: T, second: U): void {
}

genericFunction<number>(42, "Hello");

genericFunction<number, string>(42, "Hello");

class MyClass2 {

    genericMethod<T, U>(first: T, second: U): void {
    }
}

const instance = new MyClass2();

instance.genericMethod<boolean>(true, 42);

instance.genericMethod<boolean, number>(true, 42);
`,
);

exportProjectSourceFilesForEndtoEndPharoTests(project, __filename);

const fmxRep = importer.famixRepFromProject(project);

describe("Tests for concretization", () => {
  it("should parse generics", () => {
    expect(fmxRep).toBeTruthy();
  });

  it("should contain 1 generic interface", () => {
    expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(1);
  });

  it("should contain 1 generic class", () => {
    expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(1);
  });

  it("should contain a single generic interface named InterfaceE", () => {
    const listOfNames = Array.from(
      fmxRep._getAllEntitiesWithType("ParametricInterface"),
    ).map((e) => (e as ParametricInterface).name);
    expect(listOfNames).toContain("InterfaceE");
    const numberOfInterfaceE = listOfNames.filter(
      (name) => name === "InterfaceE",
    ).length;
    expect(numberOfInterfaceE).toBe(1);
  });

  it("should contain 9 concretizations", () => {
    // InterfaceE<number> from the variable annotation, plus MyClass<boolean> counted once
    // for the parameter type and once for the return type of processInstance: each declared
    // type usage gets its own ParametricEntityTyping and its own Concretization.
    expect(fmxRep._getAllEntitiesWithType("Concretization").size).toBe(9);
  });

  it("should contain a concretization of InterfaceE's type parameter T with number", () => {
    const theConcretizations = Array.from(
      fmxRep._getAllEntitiesWithType("Concretization") as Set<Concretization>,
    );
    const concretizationOfInterfaceE = theConcretizations.find(
      (c) => c.typeParameter.name === "T" && c.typeArgument.name === "number",
    );
    expect(concretizationOfInterfaceE).toBeTruthy();
  });

  it("should contain two concretizations of MyClass's type parameter V with boolean", () => {
    const theConcretizations = Array.from(
      fmxRep._getAllEntitiesWithType("Concretization") as Set<Concretization>,
    );
    const concretizationsOfMyClass = theConcretizations.filter(
      (c) => c.typeArgument.name === "boolean" && c.typeParameter.name === "V",
    );
    expect(concretizationsOfMyClass.length).toBe(2);
    concretizationsOfMyClass.forEach((c) =>
      expect(c.typeParameter.name).toBe("V"),
    );
  });

  it("should contain 3 ParametricEntityTyping associations", () => {
    expect(fmxRep._getAllEntitiesWithType("ParametricEntityTyping").size).toBe(
      5,
    );
  });

  it("should type the interfaceInstance variable as InterfaceE via its own ParametricEntityTyping", () => {
    const typings = Array.from(
      fmxRep._getAllEntitiesWithType(
        "ParametricEntityTyping",
      ) as Set<ParametricEntityTyping>,
    );
    const variableTyping = typings.find(
      (t) => t.typedEntity.name === "interfaceInstance",
    );
    expect(variableTyping).toBeTruthy();
    expect(variableTyping?.declaredType.name).toBe("InterfaceE");

    const ownConcretizations = Array.from(
      variableTyping?.concretizations ?? [],
    );
    expect(ownConcretizations.length).toBe(1);
    expect(ownConcretizations[0].typeArgument.name).toBe("number");
  });

  it("should type both processInstance's parameter and its return type as MyClass via separate ParametricEntityTyping", () => {
    // The parameter (`instance`) and the function itself (carrying the return type) are two
    // distinct typedEntity targets, each getting its own ParametricEntityTyping.
    const typings = Array.from(
      fmxRep._getAllEntitiesWithType(
        "ParametricEntityTyping",
      ) as Set<ParametricEntityTyping>,
    );
    const myClassTypings = typings.filter(
      (t) => t.declaredType.name === "MyClass",
    );
    expect(myClassTypings.length).toBe(2);

    const typedEntityNames = myClassTypings
      .map((t) => t.typedEntity.name)
      .sort();
    expect(typedEntityNames).toEqual(["instance", "processInstance"]);
  });

  it("should contain ParametricEntityTyping for genericFunction invocations", () => {
    const typings = Array.from(
      fmxRep._getAllEntitiesWithType(
        "ParametricEntityTyping",
      ) as Set<ParametricEntityTyping>,
    );

    expect(typings.length).toBeGreaterThanOrEqual(2);

    const functionTypings = typings.filter(
      (typing) => typing.declaredType.name === "void",
    );

    expect(functionTypings.length).toBe(2);
  });

  it("should contain one concretization in ParametricEntityTyping for genericFunction<number>", () => {
    const typings = Array.from(
      fmxRep._getAllEntitiesWithType(
        "ParametricEntityTyping",
      ) as Set<ParametricEntityTyping>,
    );

    const typing = typings.find(
      (typing) =>
        typing.declaredType.name === "void" &&
        typing.concretizations.size === 1,
    );

    expect(typing).toBeTruthy();

    if (!typing) return;

    expect(typing.concretizations.size).toBe(1);

    const concretization = Array.from(typing.concretizations)[0];

    expect(concretization.typeParameter.name).toBe("T");
    expect(concretization.typeArgument.name).toBe("number");

    expect(concretization.triggeringAssociation).toBe(typing);
  });

  it("should contain two concretizations in ParametricEntityTyping for genericFunction<number, string>", () => {
    const typings = Array.from(
      fmxRep._getAllEntitiesWithType(
        "ParametricEntityTyping",
      ) as Set<ParametricEntityTyping>,
    );

    const typing = typings.find(
      (typing) =>
        typing.declaredType.name === "void" &&
        typing.concretizations.size === 2,
    );

    expect(typing).toBeTruthy();

    if (!typing) return;

    const concretizations = Array.from(typing.concretizations);

    expect(concretizations.length).toBe(2);

    const concretizationT = concretizations.find(
      (c) => c.typeParameter.name === "T",
    );

    const concretizationU = concretizations.find(
      (c) => c.typeParameter.name === "U",
    );

    expect(concretizationT).toBeTruthy();
    expect(concretizationU).toBeTruthy();

    expect(concretizationT?.typeArgument.name).toBe("number");
    expect(concretizationU?.typeArgument.name).toBe("string");

    expect(concretizationT?.triggeringAssociation).toBe(typing);

    expect(concretizationU?.triggeringAssociation).toBe(typing);
  });

  it("should contain ParametricEntityTyping for genericMethod invocations", () => {
    const typings = Array.from(
      fmxRep._getAllEntitiesWithType(
        "ParametricEntityTyping",
      ) as Set<ParametricEntityTyping>,
    );

    const methodTypings = typings.filter(
      (typing) => typing.declaredType.name === "void",
    );

    expect(methodTypings.length).toBe(2);
  });

  it("should contain one concretization in ParametricEntityTyping for genericMethod<boolean>", () => {
    const typings = Array.from(
      fmxRep._getAllEntitiesWithType(
        "ParametricEntityTyping",
      ) as Set<ParametricEntityTyping>,
    );

    const typing = typings.find(
      (typing) =>
        typing.declaredType.name === "void" &&
        typing.concretizations.size === 1,
    );

    expect(typing).toBeTruthy();

    if (!typing) return;

    const concretization = Array.from(typing.concretizations)[0];

    expect(concretization.typeParameter.name).toBe("T");
    expect(concretization.typeArgument.name).toBe("boolean");

    expect(concretization.triggeringAssociation).toBe(typing);
  });

  it("should contain two concretizations in ParametricEntityTyping for genericMethod<boolean, number>", () => {
    const typings = Array.from(
      fmxRep._getAllEntitiesWithType(
        "ParametricEntityTyping",
      ) as Set<ParametricEntityTyping>,
    );

    const typing = typings.find(
      (typing) =>
        typing.declaredType.name === "void" &&
        typing.concretizations.size === 2,
    );

    expect(typing).toBeTruthy();

    if (!typing) return;

    const concretizations = Array.from(typing.concretizations);

    expect(concretizations.length).toBe(2);

    const concretizationT = concretizations.find(
      (c) => c.typeParameter.name === "T",
    );

    const concretizationU = concretizations.find(
      (c) => c.typeParameter.name === "U",
    );

    expect(concretizationT).toBeTruthy();
    expect(concretizationU).toBeTruthy();

    expect(concretizationT?.typeArgument.name).toBe("boolean");
    expect(concretizationU?.typeArgument.name).toBe("number");

    expect(concretizationT?.triggeringAssociation).toBe(typing);

    expect(concretizationU?.triggeringAssociation).toBe(typing);
  });
});
