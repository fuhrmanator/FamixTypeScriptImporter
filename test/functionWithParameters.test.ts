import { Importer } from '../src/analyze';
import { Function as FamixFunctionEntity } from "../src/lib/famix/src/model/famix/function";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/functionWithParameters.ts",
`function fct(i: number, x: string): number {
    return 0;
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for function with parameters', () => {
    
    const theFunction = Array.from(fmxRep._getAllEntitiesWithType('Function'))[0] as FamixFunctionEntity;
    it("should have two parameters", () => {
        expect(theFunction?.getParameters().size).toBe(2);
    });

    const firstParam = Array.from(theFunction?.getParameters()).find((p) => p.getName() === "i");
    it("should have a parameter 'i'", () => {
        expect(firstParam).toBeTruthy();
    });

    it("should be of type number", () => {
        expect(firstParam?.getDeclaredType().getName()).toBe("number");
        expect(firstParam?.getParentEntity()).toBe(theFunction);
    });

    const secondParam = Array.from(theFunction?.getParameters()).find((p) => p.getName() === "x");
    it("should have a parameter 'x'", () => {
        expect(secondParam).toBeTruthy();
    });

    it("should be of type string", () => {
        expect(secondParam?.getDeclaredType().getName()).toBe("string");
        expect(secondParam?.getParentEntity()).toBe(theFunction);
    });
});
