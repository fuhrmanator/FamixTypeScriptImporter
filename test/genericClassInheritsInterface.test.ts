import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParametricClass, ParametricInterface } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

project.createSourceFile("/genericClassInheritsInterface.ts",
`interface MyDaoInterface<T> {}

class MyDao<T> implements MyDaoInterface<T> {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for generic class inherits interface', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });

    it("should contain one generic class and one generic interface", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(1);
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(1);
    });

    it("should contain a generic class MyDao that implements a generic interface MyDaoInterface", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>);
        expect(cList).toBeTruthy();
        const myDao = cList.find(p => p.getName() === "MyDao");
        expect(myDao).toBeTruthy();
        const iList = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface") as Set<ParametricInterface>);
        expect(iList).toBeTruthy();
        const myDaoInterface = iList.find(p => p.getName() === "MyDaoInterface");
        expect(myDaoInterface).toBeTruthy();
        if (myDao) {
            expect(myDao.getSubInheritances().size).toBe(0);
            expect(myDao.getSuperInheritances().size).toBe(1);
            const theInheritance = (Array.from(myDao.getSuperInheritances())[0]);
            expect(theInheritance.getSuperclass()).toBeTruthy();
            expect(theInheritance.getSuperclass()).toBe(myDaoInterface);
        }
        if (myDaoInterface) {
            expect(myDaoInterface.getSubInheritances().size).toBe(1);
            expect(myDaoInterface.getSuperInheritances().size).toBe(0);
            const theInheritance = (Array.from(myDaoInterface.getSubInheritances())[0]);
            expect(theInheritance.getSubclass()).toBeTruthy();
            expect(theInheritance.getSubclass()).toBe(myDao);
        }
    });
});
