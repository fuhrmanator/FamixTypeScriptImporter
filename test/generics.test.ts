import { Importer } from '../src/analyze';
import { ParametricClass, ParametricInterface, ParameterType } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/generics.ts",
`interface MyDaoInterface<T> {}

class MyDao<T> implements MyDaoInterface<T> {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Generics', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });
    
    it("should contain one generic class and one generic interface", () => {
        expect(fmxRep._getAllEntitiesWithType("ParametricClass").size).toBe(1);
        expect(fmxRep._getAllEntitiesWithType("ParametricInterface").size).toBe(1);
    });
    
    it("should contain a generic class MyDao and a generic interface MyDaoInterface", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).name);
        expect(listOfNames).toContain("MyDao");
        const listOfNames2 = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).name);
        expect(listOfNames2).toContain("MyDaoInterface");
    });
    
    it("should contain a generic class MyDao with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>);
        expect(pList).toBeTruthy();
        const myDao = pList.find(p => p.name === "MyDao");
        expect(myDao).toBeTruthy();
        expect(myDao?.genericParameters.size).toBe(1);
        if (myDao) {
            expect((Array.from(myDao.genericParameters)[0] as ParameterType).name).toBe("T");
        }
    });
    
    it("should contain a generic interface MyDaoInterface with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface") as Set<ParametricInterface>);
        expect(pList).toBeTruthy();
        const myDaoInterface = pList.find(p => p.name === "MyDaoInterface");
        expect(myDaoInterface).toBeTruthy();
        expect(myDaoInterface?.genericParameters.size).toBe(1);
        if (myDaoInterface) {
            expect((Array.from(myDaoInterface.genericParameters)[0] as ParameterType).name).toBe("T");
        }
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
            expect(myDao.superInheritances.size).toBe(1);
            const theInheritance = (Array.from(myDao.superInheritances)[0]);
            expect(theInheritance.superclass).toBeTruthy();
            expect(theInheritance.superclass).toBe(myDaoInterface);
        }
    });
});
