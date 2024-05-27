import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParametricClass } from "../src/lib/famix/src/model/famix/parametricclass";
import { ParametricMethod } from "../src/lib/famix/src/model/famix/parametricmethod";
// import { Parameter } from "../src/lib/famix/src/model/famix/parameter";

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/parametricMethod.ts",
// test from FamixTypeScriptParametricTest >> test 1 (or whatever)
`
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generics', () => {

    const theClass = fmxRep._getFamixClass("{parametricMethod.ts}.AA");

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });
    
    it("should contain one ParametricClass", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(1);
    });

    it("should contain a ParametricClass AA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).getName());
        expect(listOfNames).toContain("AA");
    });

    it("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.getIsAbstract()).toBe(false);
    });

    it("should contain a ParametricMethod i for ParametricClass AA with type parameter T", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>);
        expect(cList).toBeTruthy();
        const AA = cList.find(c => c.getName() === "AA");
        const mList = Array.from(AA?.getMethods() as Set<ParametricMethod>);
        const i = mList?.find(m => m.getName() === "i");
        expect(i).toBeTruthy();
        expect(i?.getDeclaredType().getName()).toBe("void");
        expect(i?.getParameters().size).toBe(1);
        const pList = Array.from(i?.getParameters() as Set<Parameter>);
        const j = pList?.find(p => p.getName() === "j");
        expect(j).toBeTruthy();
        expect(j?.getDeclaredType().getName()).toBe("T");
    });

    it("should contain a public ParametricMethod i", () => {
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
