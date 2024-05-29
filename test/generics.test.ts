import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParametricClass, ParametricInterface, ParameterType } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/generics.ts",
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
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass")).map(e => (e as ParametricClass).getName());
        expect(listOfNames).toContain("MyDao");
        const listOfNames2 = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface")).map(e => (e as ParametricInterface).getName());
        expect(listOfNames2).toContain("MyDaoInterface");
    });
    
    it("should contain a generic class MyDao with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>);
        expect(pList).toBeTruthy();
        const myDao = pList.find(p => p.getName() === "MyDao");
        expect(myDao).toBeTruthy();
        expect(myDao?.getParameterTypes().size).toBe(1);
        if (myDao) {
            expect((Array.from(myDao.getParameterTypes())[0] as ParameterType).getName()).toBe("T");
        }
    });
    
    it("should contain a generic interface MyDaoInterface with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParametricInterface") as Set<ParametricInterface>);
        expect(pList).toBeTruthy();
        const myDaoInterface = pList.find(p => p.getName() === "MyDaoInterface");
        expect(myDaoInterface).toBeTruthy();
        expect(myDaoInterface?.getParameterTypes().size).toBe(1);
        if (myDaoInterface) {
            expect((Array.from(myDaoInterface.getParameterTypes())[0] as ParameterType).getName()).toBe("T");
        }
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
            expect(myDao.getSuperInheritances().size).toBe(1);
            const theInheritance = (Array.from(myDao.getSuperInheritances())[0]);
            expect(theInheritance.getSuperclass()).toBeTruthy();
            expect(theInheritance.getSuperclass()).toBe(myDaoInterface);
        }
    });
});
