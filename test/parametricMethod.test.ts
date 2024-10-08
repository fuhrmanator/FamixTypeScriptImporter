import { Importer } from '../src/analyze';
import { ParametricClass } from "../src/lib/famix/model/famix/parametric_class";
import { ParametricMethod } from "../src/lib/famix/model/famix/parametric_method";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/parametricMethod.ts",
`
class ClassParametric<T> {

    methodNotParametric(t: T): void {
    }

    methodParametric<V>(v: V): void {
    }
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generics', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });
    
    it("should contain one ParametricClass", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(1);
    });
 
    it("should contain a ParametricClass ClassParametric", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).name);
        expect(listOfNames).toContain("ClassParametric");
    });

    const theClass = fmxRep._getFamixClass("{parametricMethod.ts}.ClassParametric<T>[ClassDeclaration]");

    it("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.isAbstract).toBe(false);
    });

    it("should contain one ParametricMethod", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricMethod").size).toBe(1);
    });

    it("should contain a ParametricMethod methodParametric", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricMethod")).map(e => (e as ParametricClass).name);
        expect(listOfNames).toContain("methodParametric");
    });

    it("should contain one FamixMethod", () => {
        expect(fmxRep._getAllEntitiesWithType("Method").size).toBe(1);
    });

    it("should contain a Famix Method methodNotParametric", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("Method")).map(e => (e as ParametricClass).name);
        expect(listOfNames).toContain("methodNotParametric");
    });

    it("should contain a ParametricMethod methodParametric with type parameter V", () => {
        const pmList = Array.from(fmxRep._getAllEntitiesWithType("ParametricMethod") as Set<ParametricMethod>)
        expect(pmList).toBeTruthy();
        const parametricMethod = pmList.find(m => m.name === "methodParametric");
        const parameterTypes = parametricMethod?.genericParameters;
        expect(parameterTypes?.values().next().value.name).toBe('V')
    });

});
