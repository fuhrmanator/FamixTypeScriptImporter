import { Importer } from '../src/analyze';
import { Function as FamixFunctionEntity } from "../src/lib/famix/src/model/famix/function";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/functionsInFunction.ts",
`function fct() {
    function fct2() {
        function fct3() {
            return 0;
        }
    }
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for functions in function', () => {
    
    const theFunction1 = fmxRep._getFamixFunction("{functionsInFunction.ts}.fct[FunctionDeclaration]");
    const theFunction2 = fmxRep._getFamixFunction("{functionsInFunction.ts}.fct.Block(1:16).fct2[FunctionDeclaration]");
    const theFunction3 = fmxRep._getFamixFunction("{functionsInFunction.ts}.fct.Block(1:16).fct2.Block(2:21).fct3[FunctionDeclaration]");

    it("should have one function 'fct' with a function 'fct2'", () => {
        expect(theFunction1).toBeTruthy();
        expect(theFunction2).toBeTruthy();
        expect(theFunction1?.functions.size).toBe(1);
        expect(Array.from(theFunction1?.functions as Set<FamixFunctionEntity>)[0]).toBe(theFunction2);
    });

    it("should have one function 'fct2' with a function 'fct3'", () => {
        expect(theFunction2).toBeTruthy();
        expect(theFunction3).toBeTruthy();
        expect(theFunction2?.functions.size).toBe(1);
        expect(Array.from(theFunction2?.functions as Set<FamixFunctionEntity>)[0]).toBe(theFunction3);
    });

    it("should have one function 'fct3' with no function", () => {
        expect(theFunction3).toBeTruthy();
        expect(theFunction3?.functions.size).toBe(0);
    });
});
