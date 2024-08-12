import { Importer } from '../src/analyze';
import { project } from './testUtils';

const importer = new Importer();
project.createSourceFile("/parametricArrowFunctions.ts",
`
    const arrayLength = <T>(arr: T[]): number => {
        return arr.length;
    };
`);

const fmxRep = importer.famixRepFromProject(project);

describe('ArrowFunctions', () => {

    const functionList = fmxRep._getAllEntitiesWithType('ParametricArrowFunction');
    
    it("should have 1 parametric Arrow Function", () => {
        expect(functionList?.size).toBe(1);
    });

    const theFunction = functionList.values().next().value;
    it("should contain arrow function arrayLength", () => {
        expect(theFunction).toBeTruthy();
        expect(theFunction?.getDeclaredType().getName()).toBe("number");
        expect(theFunction?.getFullyQualifiedName()).toBe("{parametricArrowFunctions.ts}.arrayLength.ArrowFunction(2:25)[ArrowFunction]");
    });

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
        expect(theFunction?.getGenericParameters()?.values().next().value.getName()).toBe('T')
    });

});
