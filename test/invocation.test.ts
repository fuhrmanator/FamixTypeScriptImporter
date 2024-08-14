import { Importer } from '../src/analyze';
import { Class } from "../src/lib/famix/model/famix/class";
import { Method } from "../src/lib/famix/model/famix/method";
import { Invocation } from "../src/lib/famix/model/famix/invocation";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/invocation.ts",
`class A {
    public x(): void {}
}

class B {
    public y(): void {
        new A().x();
    }
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for invocation', () => {

    const theMethod = fmxRep._getFamixMethod("{invocation.ts}.A.x[MethodDeclaration]") as Method;

    it("should contain two class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(2);
    });

    it("should contain a class A and a class B", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("Class")).map(e => (e as Class).name);
        expect(listOfNames).toContain("A");
        expect(listOfNames).toContain("B");
    });

    it("should contain a method x for class A", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("Class") as Set<Class>);
        expect(cList).toBeTruthy();
        const A = cList.find(c => c.name === "A");
        const mList = Array.from(A?.methods as Set<Method>);
        const x = mList?.find(m => m.name === "x");
        expect(x).toBeTruthy();
        expect(x?.declaredType.name).toBe("void");
        expect(x?.parameters.size).toBe(0);
    });

    it("should contain a method y for class B", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("Class") as Set<Class>);
        expect(cList).toBeTruthy();
        const B = cList.find(c => c.name === "B");
        const mList = Array.from(B?.methods as Set<Method>);
        const y = mList?.find(m => m.name === "y");
        expect(y).toBeTruthy();
        expect(y?.declaredType.name).toBe("void");
        expect(y?.parameters.size).toBe(0);
    });

    it("should contain an invocation for x", () => {
        expect(theMethod).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBe(1);
        const candidates = invocations.filter(i => {
            const invocation = i as Invocation;
            return invocation.candidates.has(theMethod);
        });
        expect(candidates).toHaveLength(1);
    });

    it("should contain an invocation for x with a sender 'y'", () => {
        expect(theMethod).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBe(1);
        expect((invocations[0] as Invocation).sender).toBeTruthy();
        expect((invocations[0] as Invocation).sender).toBe(fmxRep._getFamixMethod("{invocation.ts}.B.y[MethodDeclaration]"));
    });

    it("should contain an invocation for x with a receiver 'A'", () => {
        expect(theMethod).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBe(1);
        expect((invocations[0] as Invocation).receiver).toBeTruthy();
        expect((invocations[0] as Invocation).receiver).toBe(fmxRep._getFamixClass("{invocation.ts}.A[ClassDeclaration]"));
    });

    it("should contain an invocation for x with a signature 'public x(): void'", () => {
        expect(theMethod).toBeTruthy();
        const invocations = Array.from(fmxRep._getAllEntitiesWithType("Invocation"));
        expect(invocations).toBeTruthy();
        expect(invocations.length).toBe(1);
        expect((invocations[0] as Invocation).signature).toBeTruthy();
        expect((invocations[0] as Invocation).signature).toBe('public x(): void');
    });
});
