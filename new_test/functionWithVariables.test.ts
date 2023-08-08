import { Importer } from '../src/analyze';
import { Function } from "../src/lib/famix/src/model/famix/function";

const importer = new Importer();

const fmxRep = importer.famixRepFromSource("functionWithVariables", 
    'function fct(): number {\n\
    let i: number, j: number;\n\
    const x: string = ""; \n\
    return 0;\n\
}\n\
');

describe('Tests for simple function with variables', () => {
    
    const theFunction = Array.from(fmxRep._getAllEntitiesWithType('Function'))[0] as Function;
    it("should have three variables", () => {
        expect(theFunction?.getVariables().size).toBe(3);
    });

    const firstVariable = Array.from(theFunction?.getVariables()).find( (p) => p.getName() === "i");
    it("should have a variable 'i'", () => {
        expect(firstVariable).toBeTruthy();
    });

    it("should be of type number", () => {
        expect(firstVariable?.getDeclaredType().getName()).toBe("number");
    });

    const secondVariable = Array.from(theFunction?.getVariables()).find( (p) => p.getName() === "j");
    it("should have a variable 'j'", () => {
        expect(secondVariable).toBeTruthy();
    });
    
    it("should be of type number", () => {
        expect(secondVariable?.getDeclaredType().getName()).toBe("number");
    });

    const thirdVariable = Array.from(theFunction?.getVariables()).find( (p) => p.getName() === "x");
    it("should have a variable 'x'", () => {
        expect(thirdVariable).toBeTruthy();
    });

    it("should be of type string", () => {
        expect(thirdVariable?.getDeclaredType().getName()).toBe("string");
    });
});
