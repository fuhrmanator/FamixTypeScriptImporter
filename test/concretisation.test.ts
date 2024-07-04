import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParametricClass, Concretisation } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/genericClass.ts",
`class ClassA<T> {
}

class ClassB extends ClassA<string> {
}

class ClassC extends ClassA<string> {
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain two generic classes", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(2);
    });

    it("should contain generic classes named ClassA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).getName());
        expect(listOfNames).toContain("ClassA");

        const numberOfClassA = listOfNames.filter(name => name === "ClassA").length;
        expect(numberOfClassA).toBe(2); 
    });

    const theClass = fmxRep._getFamixClass("{genericClass.ts}.ClassA<T>");

    it ("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.getIsAbstract()).toBe(false);
    });

    it("should contain one concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(2);
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
        console.log(firstElement.getConcreteEntity().getFullyQualifiedName());
        const concParameter = firstElement.getConcreteEntity().getConcreteParameters().values().next().value;
        expect(concParameter.getName()).toBe("string");
    });

});