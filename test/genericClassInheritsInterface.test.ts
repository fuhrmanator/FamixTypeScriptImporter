import { Importer } from '../src/analyze';
import { ParametricClass, ParametricInterface } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

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
        const myDao = cList.find(p => p.name === "MyDao");
        expect(myDao).toBeTruthy();
        const iList = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface") as Set<ParametricInterface>);
        expect(iList).toBeTruthy();
        const myDaoInterface = iList.find(p => p.name === "MyDaoInterface");
        expect(myDaoInterface).toBeTruthy();
        if (myDao) {
            expect(myDao.subInheritances.size).toBe(0);
            expect(myDao.superInheritances.size).toBe(1);
            const theInheritance = (Array.from(myDao.superInheritances)[0]);
            expect(theInheritance.superclass).toBeTruthy();
            expect(theInheritance.superclass).toBe(myDaoInterface);
        }
        if (myDaoInterface) {
            expect(myDaoInterface.subInheritances.size).toBe(1);
            expect(myDaoInterface.superInheritances.size).toBe(0);
            const theInheritance = (Array.from(myDaoInterface.subInheritances)[0]);
            expect(theInheritance.subclass).toBeTruthy();
            expect(theInheritance.subclass).toBe(myDao);
        }
    });
});
