import { Importer } from '../src/analyze';
import { Method, Function, ParametricClass, ParametricMethod, ArrowFunction, ParametricFunction, ParametricArrowFunction, Parameter } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/parametricTests.ts",
`
class A {
    testMethod(list: Array<any>): Array<any>{ return []}
}

function testFunction(list: Array<any>): Array<any> { return []}

const testArrowFunction = (list: Array<any>): Array<any> => { return []}

////

class Building {}

class GenA<T> {
    genericMethod<T extends Building>(t: T): T { return t }
}

function genericFunction<T extends Building>(t: T): T { return t }

const genericArrowFunction = <T extends Building>(t: T): T => {}

//// test3


class ClassA<K, V> {}

class ClassB<V> extends ClassA<string, V> {
  // not parametric because V (when it is concretized) will be the same in this method
  method(num: number, s: string, v: V): void { }

  // Parametric because V (when it is concretized) will be different depending on how this method is called
  parametricMethod(num: number, s: string, v: V): V {
    return v;
  }

  // not parametric because V (when it is concretized) will be the same in this method
  cArrow = (a: number, v: V): void => { };

  // Parametric because T (when it is concretized) will be different depending on how this method is called
  cParametricArrow = (a: number, v: V): V => {
    return v;
  };
}

`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generics (from FamixTypeScript)', () => {

    it("should parse", () => {
        expect(fmxRep).toBeTruthy();
    });
    
    it("Class A should contain a method testMethod", () => {
        const listOfMethodsOfClassA = fmxRep._getFamixClass("{parametricTests.ts}.A[ClassDeclaration]")?.getMethods();
        expect(listOfMethodsOfClassA?.size).toBe(1);
        expect(Array.from(listOfMethodsOfClassA as Set<Method>)[0].getName()).toBe("testMethod");
    });
    
    it("should contain a function testFunction", () => {
        const listOfFunctions = fmxRep._getAllEntitiesWithType("Function") as Set<Function>;
        expect(listOfFunctions.size).toBe(1);
        expect(Array.from(listOfFunctions)[0].getName()).toBe("testFunction");
    });

    it("should contain an arrow function testArrowFunction", () => {
        const listOfFunctions = fmxRep._getAllEntitiesWithType("ArrowFunction") as Set<ArrowFunction>;
        expect(listOfFunctions.size).toBe(3);
        expect(Array.from(listOfFunctions)[0].getName()).toBe("testArrowFunction");
    });

    it("should contain a class GenA", () => {
        const listOfClasses = fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>;
        expect(listOfClasses.size).toBe(4);
        expect(Array.from(listOfClasses)[0].getName()).toBe("GenA");
    });

    let parametricMethod : ParametricMethod;
    it("should contain a method genericMethod", () => {
        const listOfMethods = fmxRep._getAllEntitiesWithType("ParametricMethod") as Set<ParametricMethod>;
        expect(listOfMethods.size).toBe(1);
        parametricMethod = Array.from(listOfMethods)[0];
        expect(parametricMethod.getName()).toBe("genericMethod");
    });

    it("parametric method should have one parameter", () => {
        const parameters = parametricMethod.getParameters();
        expect(parameters).toBeTruthy();
        expect(parameters.size).toBe(1);
    });

    it("parametric method should have one parameter named 't' and of type 'T'", () => {
        const parameter = parametricMethod.getParameters().values().next().value as Parameter;
        expect(parameter).toBeTruthy();
        expect(parameter.getName()).toBe("t");
        expect(parameter.getDeclaredType().getName()).toBe("T");
    });

    let parametricFunction : ParametricFunction;
    it("should contain a function genericFunction", () => {
        const listOfFunctions = fmxRep._getAllEntitiesWithType("ParametricFunction") as Set<ParametricFunction>;
        expect(listOfFunctions.size).toBe(1);
        parametricFunction = Array.from(listOfFunctions)[0];
        expect(parametricFunction.getName()).toBe("genericFunction");
    });

    it("parametric function should have one parameter", () => {
        const parameters = parametricFunction.getParameters();
        expect(parameters).toBeTruthy();
        expect(parameters.size).toBe(1);
    });

    it("parametric function should have one parameter named 't' and of type 'T'", () => {
        const parameter = parametricFunction.getParameters().values().next().value as Parameter;
        expect(parameter).toBeTruthy();
        expect(parameter.getName()).toBe("t");
        expect(parameter.getDeclaredType().getName()).toBe("T");
    });

    let parametricArrowFunction: ParametricArrowFunction;
    it("should contain an arrow function genericArrowFunction", () => {
        const listOfParametricArrowFunctions = fmxRep._getAllEntitiesWithType("ParametricArrowFunction") as Set<ParametricArrowFunction>;
        expect(listOfParametricArrowFunctions.size).toBe(1);
        parametricArrowFunction = Array.from(listOfParametricArrowFunctions)[0];
        expect(parametricArrowFunction.getName()).toBe("genericArrowFunction");
    });

    it("parametric arrow function should have one parameter", () => {
        const parameters = parametricArrowFunction.getParameters();
        expect(parameters).toBeTruthy();
        expect(parameters.size).toBe(1);
    });

    it("parametric arrow function should have one parameter named 't' and of type 'T'", () => {
        const parameter = parametricArrowFunction.getParameters().values().next().value as Parameter;
        expect(parameter).toBeTruthy();
        expect(parameter.getName()).toBe("t");
        expect(parameter.getDeclaredType().getName()).toBe("T");
    });
});
