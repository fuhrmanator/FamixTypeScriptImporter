import { Importer } from '../src/analyze';
import { Parameter } from "../src/lib/famix/src/model/famix/parameter";
import { ParametricFunction, ParametricMethod } from '../src/lib/famix/src/model/famix';
import { project } from "./testUtils";

const importer = new Importer();

project.createSourceFile("/genericMethod.ts",
`function func<T>(arg: T): T {
    return arg;
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generics', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });
    
    it("should contain one parametric function", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricFunction").size).toBe(1);
    });

    it("should contain a generic function fun with type parameter T", () => {
        const fList = Array.from(fmxRep._getAllEntitiesWithType("ParametricFunction") as Set<ParametricFunction>);
        expect(fList).toBeTruthy();
        const func =fList.find(f => f.name === "func");
        expect(func).toBeTruthy();
        expect(func?.declaredType.name).toBe("T");
        expect(func?.parameters.size).toBe(1);
        const pList = Array.from(func?.parameters as Set<Parameter>);
        const arg = pList?.find(p => p.name === "arg");
        expect(arg).toBeTruthy();
        expect(arg?.getDeclaredType().name).toBe("T");
    });

});
