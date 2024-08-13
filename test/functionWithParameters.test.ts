import { Importer } from '../src/analyze';
import { Function } from "../src/lib/famix/src/model/famix/function";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/functionWithParameters.ts",
`function fct(i: number, x: string): number {
    return 0;
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for function with parameters', () => {
    
    const theFunction = Array.from(fmxRep._getAllEntitiesWithType('Function') as Set<Function>)[0];
    it("should have two parameters", () => {
        expect(theFunction?.parameters.size).toBe(2);
    });

    const firstParam = Array.from(theFunction?.parameters).find((p) => p.name === "i");
    it("should have a parameter 'i'", () => {
        expect(firstParam).toBeTruthy();
    });

    it("should be of type number", () => {
        expect(firstParam?.declaredType.name).toBe("number");
        expect(firstParam?.parentEntity).toBe(theFunction);
    });

    const secondParam = Array.from(theFunction?.parameters).find((p) => p.name === "x");
    it("should have a parameter 'x'", () => {
        expect(secondParam).toBeTruthy();
    });

    it("should be of type string", () => {
        expect(secondParam?.declaredType.name).toBe("string");
        expect(secondParam?.parentEntity).toBe(theFunction);
    });
});
