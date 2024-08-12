import { Importer } from '../src/analyze';
import { ParametricClass } from '../src/lib/famix/src/model/famix';
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
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).getName());
        expect(listOfNames).toContain("ClassA");

        const numberOfClassA = listOfNames.filter(name => name === "ClassA").length;
        expect(numberOfClassA).toBe(2); 
    });

    const theClass = fmxRep._getFamixClass("{concretisationGenericInstantiation.ts}.ClassA<T>[ClassDeclaration]");

    it ("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.getIsAbstract()).toBe(false);
    });

    it("should contain one concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(1);
    });

    it("The generic Class should be ClassA<T> with genericParameter T", () => {
        const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation");
        const iterator = theConcretisation.values();
        const firstElement = iterator.next().value;
        expect(firstElement.getGenericEntity()).toBe(theClass);
        const T = firstElement.getGenericEntity().getGenericParameters().values().next().value;
        expect(T.getName()).toBe("T");
    });

    it("The concrete Class should be ClassA<string> with concreteParameter string", () => {
        const theConcretisation = fmxRep._getAllEntitiesWithType("Concretisation");
        const iterator = theConcretisation.values();
        const firstElement = iterator.next().value;
        expect(firstElement.getConcreteEntity().getName()).toBe("ClassA");
        const concParameter = firstElement.getConcreteEntity().getConcreteParameters().values().next().value;
        expect(concParameter.getName()).toBe("number");
    });

    it("should contain one parameter concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(1);
    });
    
});
