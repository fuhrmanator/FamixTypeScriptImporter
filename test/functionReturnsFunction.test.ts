import { Importer } from '../src/analyze';
import { Function as FamixFunctionEntity } from "../src/lib/famix/src/model/famix/function";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/functionReturnsFunction.ts",
`export function deco() {
    function fct() {
        return function logMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                console.log(\`Calling \${propertyKey} with arguments: \${JSON.stringify(args)}\`);
                const result = originalMethod.apply(this, args);
                console.log(\`Method \${propertyKey} returned: \${JSON.stringify(result)}\`);
                return result;
            };
            return descriptor;
        };
    }
}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for function returns function', () => {
    
    const functionList = fmxRep._getAllEntitiesWithType('Function');
    it("should have four functions", () => {
        expect(functionList?.size).toBe(4);
    });

    const theFunction = Array.from(functionList)[0] as FamixFunctionEntity;
    it("should contain a function 'deco'", () => {
        expect(theFunction).toBeTruthy();
        expect(theFunction?.name).toBe('deco');
    });

    const theFunction2 = Array.from(functionList)[1] as FamixFunctionEntity;
    it("should contain a function 'fct'", () => {
        expect(theFunction2).toBeTruthy();
        expect(theFunction2?.name).toBe('fct');
    });

    const theFunction3 = Array.from(functionList)[2] as FamixFunctionEntity;
    it("should contain a function 'logMethod'", () => {
        expect(theFunction3).toBeTruthy();
        expect(theFunction3?.name).toBe('logMethod');
    });

    const theFunction4 = Array.from(functionList)[3] as FamixFunctionEntity;
    it("should contain a function 'anonymous'", () => {
        expect(theFunction4).toBeTruthy();
        expect(theFunction4?.name).toBe('anonymous');
    });
});
