import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);
project.createSourceFile("./src/parametricArrowFunctions.ts",
`
    const arrayLength = <T>(arr: T[]): number => {
        return arr.length;
    };
`);

const fmxRep = importer.famixRepFromProject(project);

describe('ArrowFunctions', () => {

    const methodList = fmxRep._getAllEntitiesWithType('ParametricArrowFunction');
    
    it("should have 1 parametric Arrow Function", () => {
        expect(methodList?.size).toBe(1);
    });

    const theFunction = fmxRep._getFamixFunction('{parametricArrowFunctions.ts}.arrayLength');

    it("should contain a parametric arrow function arrayLength", () => {
        expect(theFunction).toBeTruthy();
    });

    it("should return number", () => {
        expect(theFunction?.getDeclaredType().getName()).toBe("number");
    });

    it("should have one parameter", () => {
        expect(theFunction?.getParameters().size).toBe(1);
    });

    it("should contain a type parameter T", () => {
        expect(theFunction?.getParameterTypes()?.values().next().value.getName()).toBe('T')
    });

});