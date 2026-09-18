import { Importer } from '../src/analyze';
import { TypeParameter, ParametricArrowFunction } from '../src/lib/famix/model/famix';
import { project, exportProjectSourceFilesForEndtoEndPharoTests } from './testUtils';

const importer = new Importer();
project.createSourceFile("parametricArrowFunctions.ts",
`
    const arrayLength = <T>(arr: T[]): number => {
        return arr.length;
    };
`);

exportProjectSourceFilesForEndtoEndPharoTests(project, __filename);

const fmxRep = importer.famixRepFromProject(project);

describe('ArrowFunctions', () => {

    const functionList = fmxRep._getAllEntitiesWithType('ParametricArrowFunction') as Set<ParametricArrowFunction>;
    
    it("should have 1 parametric Arrow Function", () => {
        expect(functionList?.size).toBe(1);
    });

    const theFunction = functionList.values().next().value as ParametricArrowFunction;
    it("should contain arrow function arrayLength", () => {
        expect(theFunction).toBeTruthy();
        expect(theFunction?.typing?.declaredType.name).toBe("number");
        expect(theFunction?.fullyQualifiedName).toBe("{parametricArrowFunctions.ts}.arrayLength.Unnamed_ArrowFunction(2:25)[ArrowFunction]");
    });

    it("should contain a parametric arrow function arrayLength", () => {
        expect(theFunction).toBeTruthy();
    });

    it("should return number", () => {
        expect(theFunction?.typing?.declaredType.name).toBe("number");
    });

    it("should have one parameter", () => {
        expect(theFunction?.parameters.size).toBe(1);
    });

    it("should contain a type parameter T", () => {
        const typeParameter = theFunction?.genericParameters.values().next().value as TypeParameter;
        expect(typeParameter.name).toBe('T');
    });

});
