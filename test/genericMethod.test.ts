import { Importer } from '../src/analyze';
import { Class } from "../src/lib/famix/src/model/famix/class";
import { Parameter } from "../src/lib/famix/src/model/famix/parameter";
import { ParametricMethod } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/genericMethod.ts",
`class AA {
    public i<T> (j: T): void {}
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generics', () => {

    const theClass = fmxRep._getFamixClass("{genericMethod.ts}.AA[ClassDeclaration]");

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });
    
    it("should contain one class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(1);
    });

    it("should contain a class AA", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("Class")).map(e => (e as Class).name);
        expect(listOfNames).toContain("AA");
    });

    it("should not be an abstract class", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.isAbstract).toBe(false);
    });

    it("should contain a generic method i for class AA with type parameter T", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("Class") as Set<Class>);
        expect(cList).toBeTruthy();
        const AA = cList.find(c => c.name === "AA");
        const mList = Array.from(AA?.methods as Set<ParametricMethod>);
        const i = mList?.find(m => m.name === "i");
        expect(i).toBeTruthy();
        expect(i?.declaredType.name).toBe("void");
        expect(i?.parameters.size).toBe(1);
        const pList = Array.from(i?.parameters as Set<Parameter>);
        const j = pList?.find(p => p.name === "j");
        expect(j).toBeTruthy();
        expect(j?.getDeclaredType().name).toBe("T");
    });

    it("should contain a public method i", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParametricMethod") as Set<ParametricMethod>);
        expect(pList).toBeTruthy();
        const i = pList.find(p => p.name === "i");
        expect(i).toBeTruthy();
        if (i) {
            expect(i.kind).toBe(undefined);
            expect(i.isAbstract).toBe(false);
            expect(i.isClassSide).toBe(false);
            expect(i.isPrivate).toBe(false);
            expect(i.isProtected).toBe(false);
            expect(i.isPublic).toBe(true);
        }
    });
});
