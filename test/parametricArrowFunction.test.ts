import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import exp from 'constants';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);
project.createSourceFile("/parametricArrowFunctions.ts",
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

    const method1 = methodList.values().next().value;
    it("should contain arrow function arrayLength", () => {
        expect(method1).toBeTruthy();
        expect(method1?.getDeclaredType().getName()).toBe("number");
        expect(method1?.getFullyQualifiedName()).toBe("{parametricArrowFunctions.ts}.arrayLength.ArrowFunction(2:25)");
    });
    const theFunction = fmxRep._getFamixFunction('{parametricArrowFunctions.ts}.arrayLength.ArrowFunction(2:25)');

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
