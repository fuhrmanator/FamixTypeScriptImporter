import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Method } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);
project.createSourceFile("/abstracts.ts",
`abstract class MyAbstractClass {
    public abstract abstractMethod1();
    public abstract abstractMethod2();
    public concreteMethod() {}
}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Abstract classes and methods', () => {

    const theClass = fmxRep._getFamixClass("{abstracts.ts}.MyAbstractClass[ClassDeclaration]");
    const theMethods = theClass?.getMethods();

    it("should contain an abstract class MyAbstractClass", () => {
        expect(theClass).toBeTruthy();
        if (theClass) expect(theClass.getIsAbstract()).toBe(true);
    });

    it("should contain an abstract method MyAbstractClass.abstractMethod1", () => {
        expect(theMethods).toBeTruthy();
        if (theMethods) {
            expect(theMethods.size).toBe(3);
            if (theMethods) {
                expect(theMethods.size).toBe(3);
                const foundMethodName = fmxRep._getFamixMethod("{abstracts.ts}.MyAbstractClass.abstractMethod1[MethodDeclaration]") as Method;
                expect(foundMethodName).toBeTruthy();
                expect(foundMethodName.getIsAbstract()).toBe(true);
            }
        }
    });

    it("should contain an abstract method MyAbstractClass.abstractMethod2", () => {
        expect(theMethods).toBeTruthy();
        if (theMethods) {
            expect(theMethods.size).toBe(3);
            const foundMethodName = fmxRep._getFamixMethod("{abstracts.ts}.MyAbstractClass.abstractMethod2[MethodDeclaration]") as Method;
            expect(foundMethodName.getIsAbstract()).toBe(true);
        }
    });

    it("should contain a concrete method MyAbstractClass.concreteMethod", () => {
        expect(theMethods).toBeTruthy();
        if (theMethods) {
            expect(theMethods.size).toBe(3);
            const foundMethodName = fmxRep._getFamixMethod("{abstracts.ts}.MyAbstractClass.concreteMethod[MethodDeclaration]") as Method;
            expect(foundMethodName.getIsAbstract()).toBe(false);
        }
    });
});
