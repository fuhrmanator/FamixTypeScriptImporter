import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Invocation, Method } from "../src/lib/famix/src/model/famix";

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/invocations.ts",
`class Class1 {
    public returnHi(): string {
        return "Hi";
    }
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
        var x = a();
    }
}

function a() {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Invocations', () => {

    it("should contain method returnHi in Class1", () => {
        const clsName = "{invocations.ts}.Class1";
        const mName = "returnHi";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.getMethods())[0].getFullyQualifiedName();
            expect(methodFqn.substring(methodFqn.length-clsName.length-1-mName.length)).toBe(clsName + '.' + mName);
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn);
            expect(theMethod).toBeTruthy();    
        }
    });

    it("should contain method returnName in Class2", () => {
        const clsName = "{invocations.ts}.Class2";
        const mName = "returnName";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.getMethods())[0].getFullyQualifiedName();
            expect(methodFqn.substring(methodFqn.length-clsName.length-1-mName.length)).toBe(clsName + '.' + mName);
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn);
            expect(theMethod).toBeTruthy();    
        }
    });

    it("should contain method getString in Class3", () => {
        const clsName = "{invocations.ts}.Class3";
        const mName = "getString";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.getMethods())[0].getFullyQualifiedName();
            expect(methodFqn.substring(methodFqn.length-clsName.length-1-mName.length)).toBe(clsName + '.' + mName);
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn);
            expect(theMethod).toBeTruthy();    
        }
    });

    it("should contain an invocation for returnHi", () => {
        const clsName = "{invocations.ts}.Class1";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.getMethods())[0].getFullyQualifiedName();
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn) as Method;
            expect(theMethod).toBeTruthy();
            const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
            expect(invocations).toBeTruthy();
            expect(invocations.length).toBeTruthy();
            const candidates = invocations.filter(i => {
                const invocation = i as Invocation;
                return invocation.getCandidates().has(theMethod);
            });
            expect(candidates).toHaveLength(1);
        }
    });

    it("should contain an invocation for returnHi with a receiver of 'Class1'", () => {
        const clsName = "{invocations.ts}.Class1";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.getMethods())[0].getFullyQualifiedName();
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn) as Method;
            expect(theMethod).toBeTruthy();
            const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
            expect(invocations).toBeTruthy();
            expect(invocations.length).toBeTruthy();
            expect((invocations[0] as Invocation).getReceiver()).toBeTruthy();
            expect((invocations[0] as Invocation).getReceiver()).toBe(fmxRep._getFamixClass("{invocations.ts}.Class1"));
        }
    });

    it("should contain an invocation for returnHi with a signature 'public returnHi(): string'", () => {
        const clsName = "{invocations.ts}.Class1";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.getMethods())[0].getFullyQualifiedName();
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn) as Method;
            expect(theMethod).toBeTruthy();
            const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
            expect(invocations).toBeTruthy();
            expect(invocations.length).toBeTruthy();
            expect((invocations[0] as Invocation).getSignature()).toBeTruthy();
            expect((invocations[0] as Invocation).getSignature()).toBe('public returnHi(): string');
        }
    });

    it("should contain an invocation for a function 'a'", () => {
        const theFunction = fmxRep._getFamixFunction("{invocations.ts}.a");
        expect(theFunction).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBeTruthy();
        expect((invocations[0] as Invocation).getSignature()).toBeTruthy();
        expect((invocations[0] as Invocation).getSignature()).toBe('public returnHi(): string');
    });
});
