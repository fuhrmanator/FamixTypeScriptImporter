import { Importer } from '../src/analyze';
import { Method } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/entities_json.ts",
`class EntityClass {
    constructor() {}
    public move() {}
    private move2() {}
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Entities json', () => {

    const jsonOutput = fmxRep.getJSON();
    const parsedModel = JSON.parse(jsonOutput);

    it("should generate valid json", () => { // smoke test parse (change to non-empty)
        expect(parsedModel).toBeTruthy();
    });

    it("should generate json with FM3 FamixTypeScript.Class for EntityClass", () => {
        expect(jsonOutput).toMatch(/"FM3":"FamixTypeScript.Class","id":[1-9]\d*|0,"sourceAnchor":{"ref":[1-9]\d*|0},"name":"EntityClass"/);
    });

    it("should contain an EntityClass with three methods", () => {
        const theClass = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === "EntityClass"))[0];
        expect(theClass.methods.length).toBe(3);
    });

    it("should have three methods: move, move2 and constructor", () => { 
        const theClass = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === "EntityClass"))[0];
        const mNames: Set<string> = new Set();
        theClass.methods.forEach(m => {
            const entityCls = fmxRep.getFamixEntityById(m.ref as number) as Method;
            mNames.add(entityCls.name);
        });
        expect(mNames.has("move") &&
            mNames.has("move2") &&
            mNames.has("constructor")).toBe(true);
    });

    it("should have method move", () => { 
        const theMethod = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Method" && el.name === "move"))[0];
        expect(theMethod).toBeTruthy();
    });
});
