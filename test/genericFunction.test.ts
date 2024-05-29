import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Class } from "../src/lib/famix/src/model/famix/class";
import { Parameter } from "../src/lib/famix/src/model/famix/parameter";
import { ParametricFunction, ParametricMethod } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/genericMethod.ts",
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
        const func =fList.find(f => f.getName() === "func");
        expect(func).toBeTruthy();
        expect(func?.getDeclaredType().getName()).toBe("T");
        expect(func?.getParameters().size).toBe(1);
        const pList = Array.from(func?.getParameters() as Set<Parameter>);
        const arg = pList?.find(p => p.getName() === "arg");
        expect(arg).toBeTruthy();
        expect(arg?.getDeclaredType().getName()).toBe("T");
    });

});
