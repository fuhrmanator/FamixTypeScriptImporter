import { Importer } from '../src/analyze';
import { Concretisation, ParametricClass } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/concretisationGenericInstantiation.ts",
`
class ClassA<T> {
    property: T;
    
    constructor(value: T) {
        this.property = value;
    }
}

const instance = new ClassA<number>(42);
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 1 generic class", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(2);
    });

    it("should contain generic classes named ClassA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).name);
        expect(listOfNames).toContain("ClassA");

        const numberOfClassA = listOfNames.filter(name => name === "ClassA").length;
        expect(numberOfClassA).toBe(2); 
    });

    const theClass = fmxRep._getFamixClass("{concretisationGenericInstantiation.ts}.ClassA<T>[ClassDeclaration]");

    it ("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.isAbstract).toBe(false);
    });

    it("should contain one concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(1);
    });

    it("The generic Class should be ClassA<T> with genericParameter T", () => {
        const theConcretisations = fmxRep._getAllEntitiesWithType("Concretisation") as Set<Concretisation>;
        const iterator = theConcretisations.values();
        const firstElement = iterator.next().value as Concretisation;
        expect(firstElement.genericEntity).toBe(theClass);
        const T = firstElement.genericEntity.genericParameters.values().next().value as ParametricClass;
        expect(T.name).toBe("T");
    });

    it("The concrete Class should be ClassA<string> with concreteParameter string", () => {
        const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation") as Set<Concretisation>;
        const iterator = theConcretisation.values();
        const firstElement = iterator.next().value as Concretisation;
        expect(firstElement.concreteEntity.name).toBe("ClassA");
        const concParameter = firstElement.concreteEntity.concreteParameters.values().next().value as ParametricClass;
        expect(concParameter.name).toBe("number");
    });

    it("should contain one parameter concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(1);
    });
    
});
