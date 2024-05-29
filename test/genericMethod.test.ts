import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Class } from "../src/lib/famix/src/model/famix/class";
import { Parameter } from "../src/lib/famix/src/model/famix/parameter";
import { ParametricMethod } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/genericMethod.ts",
`class AA {
    public i<T> (j: T): void {}
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generics', () => {

    const theClass = fmxRep._getFamixClass("{genericMethod.ts}.AA");

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });
    
    it("should contain one class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(1);
    });

    it("should contain a class AA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("Class")).map(e => (e as Class).getName());
        expect(listOfNames).toContain("AA");
    });

    it("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.getIsAbstract()).toBe(false);
    });

    it("should contain a generic method i for class AA with type parameter T", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("Class") as Set<Class>);
        expect(cList).toBeTruthy();
        const AA = cList.find(c => c.getName() === "AA");
        const mList = Array.from(AA?.getMethods() as Set<Method>);
        const i = mList?.find(m => m.getName() === "i");
        expect(i).toBeTruthy();
        expect(i?.getDeclaredType().getName()).toBe("void");
        expect(i?.getParameters().size).toBe(1);
        const pList = Array.from(i?.getParameters() as Set<Parameter>);
        const j = pList?.find(p => p.getName() === "j");
        expect(j).toBeTruthy();
        expect(j?.getDeclaredType().getName()).toBe("T");
    });

    it("should contain a public method i", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParametricMethod") as Set<ParametricMethod>);
        expect(pList).toBeTruthy();
        const i = pList.find(p => p.getName() === "i");
        expect(i).toBeTruthy();
        if (i) {
            expect(i.getKind()).toBe(undefined);
            expect(i.getIsAbstract()).toBe(false);
            expect(i.getIsClassSide()).toBe(false);
            expect(i.getIsPrivate()).toBe(false);
            expect(i.getIsProtected()).toBe(false);
            expect(i.getIsPublic()).toBe(true);
        }
    });
});
