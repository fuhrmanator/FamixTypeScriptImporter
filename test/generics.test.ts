import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParameterizableClass, ParameterizableInterface, ParameterType } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project();

project.createSourceFile("generics.ts",
`interface MyDaoInterface<T> {}

class MyDao<T> implements MyDaoInterface<T> {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Generics', () => {

    it("should parse generics", () => {
        expect(fmxRep).toBeTruthy();
    });
    
    it("should contain one generic class and one generic interface", () => {
        expect(fmxRep._getAllEntitiesWithType("ParameterizableClass").size).toBe(1);
        expect(fmxRep._getAllEntitiesWithType("ParameterizableInterface").size).toBe(1);
    });
    
    it("should contain a generic class MyDao and a generic interface MyDaoInterface", () => {
        const listOfNames = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableClass")).map(e => (e as ParameterizableClass).getName());
        expect(listOfNames).toContain("MyDao");
        const listOfNames2 = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableInterface")).map(e => (e as ParameterizableInterface).getName());
        expect(listOfNames2).toContain("MyDaoInterface");
    });
    
    it("should contain a generic class MyDao with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableClass") as Set<ParameterizableClass>);
        expect(pList).toBeTruthy();
        const myDao = pList.find(p => p.getName() === "MyDao");
        expect(myDao).toBeTruthy();
        expect(myDao?.getParameterTypes().size).toBe(1);
        if (myDao) {
            expect((Array.from(myDao.getParameterTypes())[0] as ParameterType).getName()).toBe("T");
        }
    });
    
    it("should contain a generic interface MyDaoInterface with a type parameter T", () => {
        const pList = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableInterface") as Set<ParameterizableInterface>);
        expect(pList).toBeTruthy();
        const myDaoInterface = pList.find(p => p.getName() === "MyDaoInterface");
        expect(myDaoInterface).toBeTruthy();
        expect(myDaoInterface?.getParameterTypes().size).toBe(1);
        if (myDaoInterface) {
            expect((Array.from(myDaoInterface.getParameterTypes())[0] as ParameterType).getName()).toBe("T");
        }
    });
    
    it("should contain a generic class MyDao that implements a generic interface MyDaoInterface", () => {
        const cList = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableClass") as Set<ParameterizableClass>);
        expect(cList).toBeTruthy();
        const myDao = cList.find(p => p.getName() === "MyDao");
        expect(myDao).toBeTruthy();
        const iList = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableInterface") as Set<ParameterizableInterface>);
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
