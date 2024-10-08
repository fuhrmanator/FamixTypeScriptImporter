import { Importer } from '../src/analyze';
import { Function as FamixFunctionEntity } from "../src/lib/famix/model/famix/function";
import { project } from './testUtils';

const importer = new Importer();
project.createSourceFile("/simpleFunction.ts",
`function fct(): number {
    return 0;
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for simple function', () => {
    
    const functionList = fmxRep._getAllEntitiesWithType('Function');
    it("should have one function", () => {
        expect(functionList?.size).toBe(1);
    });

    const theFunction = Array.from(functionList)[0] as FamixFunctionEntity;
    it("should contain a function 'fct'", () => {
        expect(theFunction).toBeTruthy();
        expect(theFunction?.name).toBe('fct');
    });

    it("should return number", () => {
        expect(theFunction?.declaredType.name).toBe("number");
    });

    it("should have no parameter", () => {
        expect(theFunction?.parameters.size).toBe(0);
    });
});
