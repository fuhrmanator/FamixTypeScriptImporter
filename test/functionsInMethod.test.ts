import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Function as FamixFunctionEntity } from "../src/lib/famix/src/model/famix/function";

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

project.createSourceFile("/functionsInMethod.ts",
`class F {
    m() {
        function fct2() {
            function fct3() {
                return 0;
            }
        }
    }
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for functions in method', () => {
    
    const theMethod = fmxRep._getFamixMethod("{functionsInMethod.ts}.F.m");
    const theFunction2 = fmxRep._getFamixFunction("{functionsInMethod.ts}.F.m.Block(2:9).fct2");
    const theFunction3 = fmxRep._getFamixFunction("{functionsInMethod.ts}.F.m.Block(2:9).fct2.Block(3:25).fct3");

    it("should have one method 'm' with a function 'fct2'", () => {
        expect(theMethod).toBeTruthy();
        expect(theFunction2).toBeTruthy();
        expect(theMethod?.getFunctions().size).toBe(1);
        expect(Array.from(theMethod?.getFunctions() as Set<FamixFunctionEntity>)[0]).toBe(theFunction2);
    });

    it("should have one function 'fct2' with a function 'fct3'", () => {
        expect(theFunction2).toBeTruthy();
        expect(theFunction3).toBeTruthy();
        expect(theFunction2?.getFunctions().size).toBe(1);
        expect(Array.from(theFunction2?.getFunctions() as Set<FamixFunctionEntity>)[0]).toBe(theFunction3);
    });

    it("should have one function 'fct3' with no function", () => {
        expect(theFunction3).toBeTruthy();
        expect(theFunction3?.getFunctions().size).toBe(0);
    });
});
