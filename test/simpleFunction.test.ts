import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Function as FamixFunctionEntity } from "../src/lib/famix/src/model/famix/function";

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);
project.createSourceFile("./src/simpleFunction.ts",
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
        expect(theFunction?.getName()).toBe('fct');
    });

    it("should return number", () => {
        expect(theFunction?.getDeclaredType().getName()).toBe("number");
    });

    it("should have no parameter", () => {
        expect(theFunction?.getParameters().size).toBe(0);
    });
});
