import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

project.createSourceFile("/invocation.ts",
`class Class1 {
    public returnHi() {}
}

class Class2 {
    public returnName() {}
}

class Class3 {
    public getString() {
        var class1Obj = new Class1();
        var class2Obj = new Class2();
        var returnValue1 = class1Obj.returnHi();
        var returnValue2 = class2Obj.returnName();
    }
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Invocations json', () => {

    const jsonOutput = fmxRep.getJSON();
    const parsedModel = JSON.parse(jsonOutput);

    it("should contain a class Class3 with one method: getString", () => {
        const invocationCls = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === "Class3"))[0];
        expect(invocationCls.methods.length).toBe(1);
        const methodNames: Array<string> = ['getString'];
        const invocationClsMethods = parsedModel.filter(e => invocationCls.methods.some(m => m.ref === e.id));
        expect(invocationClsMethods.length).toBeGreaterThan(0);
        const checkMethodName = invocationClsMethods.every(m => methodNames.includes(m.name));
        expect(checkMethodName).toBe(true);
    });

    it("should have one invocation for method returnHi in Class1",  () => {
        verifyInvocation(parsedModel, "Class1", "returnHi");
    });

    it("should have one invocation for method returnName in Class2",  () => {
        verifyInvocation(parsedModel, "Class2", "returnName");
    });
});

function verifyInvocation(parsedModel: any, theClass: string, theMethod: string) {
    const invocationCls = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === theClass))[0];
    const invocationClsMethods = parsedModel.filter(e => invocationCls.methods.some(m => m.ref === e.id));
    const methodNames: Array<string> = [theMethod];
    invocationClsMethods.forEach(m => expect(methodNames).toContain(m.name));
    const foundMethods = invocationClsMethods.filter(m => methodNames.includes(m.name));
    expect(foundMethods.length).toBe(1);
    const checkMethodHasInvocation = foundMethods.every(m => m.incomingInvocations !== undefined);
    expect(checkMethodHasInvocation).toBe(true);
    invocationClsMethods.forEach(method => {
        const invocationCls = parsedModel.filter(e => e.FM3 === "FamixTypeScript.Invocation"
            && method.incomingInvocations.some(m => m.ref === e.id));
        const checkHasRelatedToMethod = invocationCls.every(a => a.candidates.length && a.candidates[0].ref === method.id);
        expect(checkHasRelatedToMethod).toBe(true);
    });
}
