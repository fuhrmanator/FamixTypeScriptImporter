import { Importer } from '../src/analyze';
import { Invocation, Method } from "../src/lib/famix/model/famix";
import { project } from './testUtils';

// TODO: ⏳ Review if the test is still in a sync with a current solution.
//       🛠️ Fix code to pass the tests and remove .skip

const importer = new Importer();

project.createSourceFile("/invocations.ts",
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

((i:number) => {
  console.log(\`invoked with \${i}\`);
})(1);

`);

const fmxRep = importer.famixRepFromProject(project);

describe.skip('Invocations', () => {

    it("should contain method returnHi in Class1", () => {
        const clsName = "{invocations.ts}.Class1[ClassDeclaration]";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.methods)[0].fullyQualifiedName;
            expect(methodFqn).toBe("{invocations.ts}.Class1.returnHi[MethodDeclaration]");
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn);
            expect(theMethod).toBeTruthy();    
        }
    });

    it("should contain method returnName in Class2", () => {
        const clsName = "{invocations.ts}.Class2[ClassDeclaration]";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.methods)[0].fullyQualifiedName;
            expect(methodFqn).toBe("{invocations.ts}.Class2.returnName[MethodDeclaration]");
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn);
            expect(theMethod).toBeTruthy();    
        }
    });

    it("should contain method getString in Class3", () => {
        const clsName = "{invocations.ts}.Class3[ClassDeclaration]";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.methods)[0].fullyQualifiedName;
            expect(methodFqn).toBe("{invocations.ts}.Class3.getString[MethodDeclaration]");
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn);
            expect(theMethod).toBeTruthy();    
        }
    });

    it("should contain an invocation for returnHi", () => {
        const clsName = "{invocations.ts}.Class1[ClassDeclaration]";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.methods)[0].fullyQualifiedName;
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn) as Method;
            expect(theMethod).toBeTruthy();
            const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
            expect(invocations).toBeTruthy();
            expect(invocations.length).toBeTruthy();
            const candidates = invocations.filter(i => {
                const invocation = i as Invocation;
                return invocation.candidates.has(theMethod);
            });
            expect(candidates).toHaveLength(1);
        }
    });

    it("should contain an invocation for returnHi with a receiver of 'Class1'", () => {
        const clsName = "{invocations.ts}.Class1[ClassDeclaration]";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.methods)[0].fullyQualifiedName;
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn) as Method;
            expect(theMethod).toBeTruthy();
            const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
            expect(invocations).toBeTruthy();
            expect(invocations.length).toBeTruthy();
            expect((invocations[0] as Invocation).receiver).toBeTruthy();
            expect((invocations[0] as Invocation).receiver).toBe(fmxRep._getFamixClass("{invocations.ts}.Class1[ClassDeclaration]"));
        }
    });

    it("should contain an invocation for returnHi with a signature 'public returnHi(): string'", () => {
        const clsName = "{invocations.ts}.Class1[ClassDeclaration]";
        const theClass = fmxRep._getFamixClass(clsName);
        expect(theClass).toBeTruthy();
        if (theClass) {
            const methodFqn = Array.from(theClass.methods)[0].fullyQualifiedName;
            const theMethod = fmxRep.getFamixEntityByFullyQualifiedName(methodFqn) as Method;
            expect(theMethod).toBeTruthy();
            const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
            expect(invocations).toBeTruthy();
            expect(invocations.length).toBeTruthy();
            expect((invocations[0] as Invocation).signature).toBeTruthy();
            expect((invocations[0] as Invocation).signature).toBe('public returnHi(): string');
        }
    });

    it("should contain an invocation for a function 'a'", () => {
        const theFunction = fmxRep._getFamixFunction("{invocations.ts}.a[FunctionDeclaration]");
        expect(theFunction).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBeTruthy();
        expect((invocations[0] as Invocation).signature).toBeTruthy();
        expect((invocations[0] as Invocation).signature).toBe('public returnHi(): string');
    });

    // to find the unnamed IIFE, we need a better approach (AST traverse for call expressions)
    // current ts2famix relies on findReferencesAsNodes() which doesn't work on unnamed IIFEs or arrow functions
    it.skip("should contain an invocation for the unnamed IIFE", () => {
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations.length).toBe(5);
        expect(invocations).toBeTruthy();
        const iifeInvocation = invocations.find(i => {
            const invocation = i as Invocation;
            return invocation.signature === '(i:number) => { console.log(`invoked with ${i}`); }';
        });
        expect(iifeInvocation).toBeTruthy();
    });
});
