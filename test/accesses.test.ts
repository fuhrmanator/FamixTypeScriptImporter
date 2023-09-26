import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Access } from '../src/lib/famix/src/model/famix/access';
import { Parameter } from '../src/lib/famix/src/model/famix/parameter';
import { Variable } from '../src/lib/famix/src/model/famix/variable';

const importer = new Importer();
const project = new Project();
project.createSourceFile('accesses.ts',
`var b = 2;

var x = b;

class P {
    m(param) {
        var z = param;
        console.log(b);
    }
}
`);
project.createSourceFile('accesses2.ts',
`class AAA {
    public method(): void {}
}
    
const x1 = new AAA();
x1.method();`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for accesses', () => {
    
    it("should contain two classes", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(2);
    });

    const accessFile1 = fmxRep._getFamixFile("accesses.ts");
    const accessFile2 = fmxRep._getFamixFile("accesses2.ts");
    const theMethod = fmxRep._getFamixMethod("m");

    it("should contain one access to 'b'", () => {
        const theVariable = Array.from(fmxRep._getAllEntitiesWithType("Variable") as Set<Variable>).find(v => v.getName() === "b");
        const theAccess = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.getVariable() === theVariable && a.getAccessor() === accessFile1);
        expect(theAccess).toBeTruthy();
        expect(theAccess?.getIsWrite()).toBe(undefined);
    });

    it("should contain one access to 'param'", () => {
        const theParam = Array.from(fmxRep._getAllEntitiesWithType("Parameter") as Set<Parameter>).find(v => v.getName() === "param");
        const theAccess = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.getVariable() === theParam && a.getAccessor() === theMethod);
        expect(theAccess).toBeTruthy();
        expect(theAccess?.getIsWrite()).toBe(undefined);
    });

    it("should contain an access to x1.method from the script entity of accesses2.ts", () => {
        const theVariable = Array.from(fmxRep._getAllEntitiesWithType("Variable") as Set<Variable>).find(v => v.getName() === "x1");
        expect(theVariable).toBeTruthy();
        const theAccess = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.getVariable() === theVariable && a.getAccessor() === accessFile2);
        expect(theAccess).toBeTruthy();
        expect(theAccess?.getIsWrite()).toBe(undefined);
    });
});
