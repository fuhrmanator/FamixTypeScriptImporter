import { Importer, logger } from '../src/analyze';
import { Class, Enum, Function, Method, Parameter } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();
// logger.settings.minLevel = 0; // all your messages are belong to us

project.createSourceFile("arrowFunctions.ts",
`
    // Basic arrow function
    const add = (a: number, b: number): number => a + b;

    // Arrow function with a code block
    const multiply = (c: number, d: number): number => {
        return c * d;
    };

    // Arrow function with no parameters
    const greet = (): void => {
        console.log('Hello!');
    };

    // Arrow function with a single parameter
    const square = (x: number): number => x * x;

    // Arrow function declaring a class inside its body
    test('blah', t => {
      class Person {
        @JsonProperty() 
        @JsonClassType({type: () => [Number]})
        age: number;
      }
    });

    // Arrow function declaring a class inside its body (with same name as before)
    test('blah', t => {
      class User {
        id: string;

        toUserInfo(): string {
          return this.id;
        }
        p : number;
      }
      function a() {}
      const pi = 3.14;
      enum Color {
        Red,
        Green,
        Blue
      }
    });

`);

const fmxRep = importer.famixRepFromProject(project);

describe('ArrowFunctions', () => {

    const methodList = fmxRep._getAllEntitiesWithType('ArrowFunction');
    
    it("should have several Arrow Functions", () => {
        // hint: count the number of '=>' in the test file
        expect(methodList?.size).toBe(7);
    });

    it("should contain arrow function add and should return number should have two parameters", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.add.ArrowFunction(3:17)[ArrowFunction]');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.declaredType.name).toBe("number");
        expect(theFunction?.signature).toBe("(a: number, b: number) => number");
        const params = theFunction?.parameters;
        expect(params).toBeTruthy();
        expect(params?.size).toBe(2);

        const pIter = params?.values();
        expect(pIter).toBeTruthy();
        const firstParam = pIter?.next().value as Parameter;
        expect(firstParam).toBeTruthy();
        expect(firstParam.name).toBe("a");
        expect(firstParam.declaredType.name).toBe("number");
        const secondParam = pIter?.next().value as Parameter;
        expect(secondParam).toBeTruthy();
        expect(secondParam.name).toBe("b");
        expect(secondParam.declaredType.name).toBe("number");
    });

    it("should contain arrow function multiply with two parameters", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.multiply.ArrowFunction(6:22)[ArrowFunction]');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.signature).toBe("(c: number, d: number) => number");
        expect(theFunction?.declaredType.name).toBe("number");
        const params = theFunction?.parameters;
        expect(params).toBeTruthy();
        expect(params?.size).toBe(2);

        const pIter = params?.values();
        expect(pIter).toBeTruthy();
        const firstParam = pIter?.next().value as Parameter;
        expect(firstParam).toBeTruthy();
        expect(firstParam.name).toBe("c");
        expect(firstParam.declaredType.name).toBe("number");
        const secondParam = pIter?.next().value as Parameter;
        expect(secondParam).toBeTruthy();
        expect(secondParam.name).toBe("d");
        expect(secondParam.declaredType.name).toBe("number");
    });

    it("should contain arrow function greet with no parameters", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.greet.ArrowFunction(11:19)[ArrowFunction]');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.declaredType.name).toBe("void");
        expect(theFunction?.parameters.size).toBe(0);
    });

    it("should contain arrow function square", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.square.ArrowFunction(16:20)[ArrowFunction]');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.declaredType.name).toBe("number");
        expect(theFunction?.parameters.size).toBe(1);
        const pIter = theFunction?.parameters.values();
        expect(pIter).toBeTruthy();
        const p1 = pIter?.next().value as Parameter;
        expect(p1.name).toBe("x");
        expect(p1.declaredType.name).toBe("number");
    });

    it("should contain an arrow function with a single parameter t", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.ArrowFunction(19:18)[ArrowFunction]');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.declaredType.name).toBe("void");
        expect(theFunction?.signature).toBe("(t) => void");
        const params = theFunction?.parameters;
        expect(params).toBeTruthy();
        expect(params?.size).toBe(1);

        const pIter = params?.values();
        expect(pIter).toBeTruthy();
        const firstParam = pIter?.next().value as Parameter;
        expect(firstParam).toBeTruthy();
        expect(firstParam.name).toBe("t");
        expect(firstParam.declaredType.name).toBe("any");
    });

    it("should contain a class User inside an arrow function", () => {
        const theClass = fmxRep._getFamixClass('{arrowFunctions.ts}.ArrowFunction(19:18).Block(19:23).Person[ClassDeclaration]');
        expect(theClass).toBeTruthy();
        expect(theClass?.name).toBe("Person");
    });

    it("should contain an method toUserInfo inside a class User inside an arrow function", () => {
        const theMethod = fmxRep._getFamixMethod('{arrowFunctions.ts}.ArrowFunction(28:18).Block(28:23).User.toUserInfo[MethodDeclaration]');
        expect(theMethod).toBeTruthy();
        expect(theMethod?.declaredType.name).toBe("string");
        expect(theMethod?.parameters.size).toBe(0);
    });

    it("should contain a class User with an enum Color inside an arrow function", () => {
        const theEnums = fmxRep._getAllEntitiesWithType('Enum') as Set<Enum>;
        const theEnum = theEnums.values().next().value as Enum;
        expect(theEnum.name).toBe("Color");
    });

    it("should contain a class User with function a", () => {
        const theFunction = fmxRep._getFamixFunction('{arrowFunctions.ts}.ArrowFunction(28:18).Block(28:23).a[FunctionDeclaration]');
        expect(theFunction).toBeTruthy();
        expect(theFunction?.declaredType.name).toBe("void");
        expect(theFunction?.parameters.size).toBe(0);
    }); 

});
