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
project.createSourceFile("./src/arrowFunctions.ts",
`
    // Basic arrow function
    const add = (a: number, b: number): number => a + b;

    // Arrow function with a code block
    const multiply = (a: number, b: number): number => {
        return a * b;
    };

    // Arrow function with no parameters
    const greet = (): void => {
        console.log('Hello!');
    };

    // Arrow function with a single parameter
    const square = (x: number): number => x * x;
`);

const fmxRep = importer.famixRepFromProject(project);

describe('ArrowFunctions', () => {

    const methodList = fmxRep._getAllEntitiesWithType('ArrowFunction');
    
    it("should have 4 Arrow Functions", () => {
        expect(methodList?.size).toBe(4);
    });

    it("should contain arrow function add and should return number should have two parameters", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.add.ArrowFunction(3:17)');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.getDeclaredType().getName()).toBe("number");
        expect(theFunction?.getParameters().size).toBe(2);
    });

    it("should contain arrow function multiply", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.multiply.ArrowFunction(6:22)');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.getDeclaredType().getName()).toBe("number");
        expect(theFunction?.getParameters().size).toBe(2);
    });

    it("should contain arrow function greet", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.greet.ArrowFunction(11:19)');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.getDeclaredType().getName()).toBe("void");
        expect(theFunction?.getParameters().size).toBe(0);
    });

    it("should contain arrow function square", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.square.ArrowFunction(16:20)');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.getDeclaredType().getName()).toBe("number");
        expect(theFunction?.getParameters().size).toBe(1);
    });

});
