import { Importer } from '../src/analyze';
import { Method } from "../src/lib/famix/src/model/famix/method";
import { Variable } from "../src/lib/famix/src/model/famix/variable";
import { Invocation } from "../src/lib/famix/src/model/famix/invocation";
import { Class } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/genericWithInvocation.ts",
`class AA {
    public i<T> (j: T): void {}
}

const x = new AA();
x.i<string>("ok");
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generics', () => {

    const theMethod = fmxRep._getFamixMethod("{genericWithInvocation.ts}.AA.i<T>[MethodDeclaration]") as Method;

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain one class", () => {
        const klass = fmxRep._getFamixClass("{genericWithInvocation.ts}.AA[ClassDeclaration]") as Class;
        expect(klass).toBeTruthy();
    });

    it("should contain a variable x instance of AA", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("Variable") as Set<Variable>);
        expect(pList).toBeTruthy();
        const x = pList.find(p => p.getName() === "x");
        expect(x).toBeTruthy();
        expect(x?.getDeclaredType().getName()).toBe("AA");
    });
    
    it("should contain an invocation for i", () => {
        expect(theMethod).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBe(1);
        const candidates = invocations.filter(i => {
            const invocation = i as Invocation;
            return invocation.getCandidates().has(theMethod);
        });
        expect(candidates).toHaveLength(1);
    });

    it("should contain an invocation for i with a sender 'genericWithInvocation.ts'", () => {
        expect(theMethod).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBe(1);
        expect((invocations[0] as Invocation).getSender()).toBeTruthy();
        expect((invocations[0] as Invocation).getSender()).toBe(fmxRep._getFamixFile("genericWithInvocation.ts"));
    });

    it("should contain an invocation for i with a receiver 'AA'", () => {
        expect(theMethod).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBe(1);
        expect((invocations[0] as Invocation).getReceiver()).toBeTruthy();
        expect((invocations[0] as Invocation).getReceiver()).toBe(fmxRep._getFamixClass("{genericWithInvocation.ts}.AA[ClassDeclaration]"));
    });

    it("should contain an invocation for i with a signature 'public i<T> (j: T): void'", () => {
        expect(theMethod).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBe(1);
        expect((invocations[0] as Invocation).getSignature()).toBeTruthy();
        expect((invocations[0] as Invocation).getSignature()).toBe('public i<T> (j: T): void');
    });
});
