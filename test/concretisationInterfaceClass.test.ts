import { Importer } from '../src/analyze';
import { ParametricInterface } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/concretisationInterfaceClass.ts",
`
interface InterfaceD<T> {
}

class ClassG implements InterfaceD<number> {
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concretisation', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain 2 generic interfaces", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(2);
    });

    it("should contain generic interfaces named InterfaceD", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).name);
        expect(listOfNames).toContain("InterfaceD");

        const numberOfInterfaceD = listOfNames.filter(name => name === "InterfaceD").length;
        expect(numberOfInterfaceD).toBe(2); 
    });

    it("should contain one concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("Concretisation").size).toBe(1);
    });
    
    it("should contain one parameter concretisation", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterConcretisation").size).toBe(1);
    });

});
