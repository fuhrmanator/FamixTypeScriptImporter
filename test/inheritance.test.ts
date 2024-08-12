import { Importer } from '../src/analyze';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/inheritance.ts",
`class Animal {}
class Fish extends Animal {}
interface Flyable {}
class Bird extends Animal implements Flyable {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Inheritance', () => {

    const jsonOutput = fmxRep.getJSON();
    const parsedModel = JSON.parse(jsonOutput);
    const idToElementMap = fmxRep._initMapFromModel(jsonOutput);    

    it("should contain a Fish class who has a superclass Animal", () => {
        const fishCls = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === "Fish"))[0];
        const superInheritance = idToElementMap.get(fishCls.superInheritances[0].ref) as any;
        expect((idToElementMap.get(superInheritance.superclass.ref) as any).name).toBe("Animal");
    });

    it("should contain an Animal class who has a subclass Fish", () => {
        const animalCls = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === "Animal"))[0];
        const subInheritance = idToElementMap.get(animalCls.subInheritances[0].ref) as any;
        expect((idToElementMap.get(subInheritance.subclass.ref) as any).name).toBe("Fish");
    });
    
    it("should contain a Flyable interface", () => {
        const flyableInterface = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Interface" && el.name === "Flyable"))[0];
        expect(flyableInterface).toBeTruthy();
    });
    
    it("should contain a Bird class who has a superclass Animal and implements a Flyable interface", () => {
        const animalCls = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === "Animal"))[0];
        expect(animalCls).toBeTruthy();
        const flyableInterface = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Interface" && el.name === "Flyable"))[0];
        expect(flyableInterface).toBeTruthy();
        const birdCls = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === "Bird"))[0];
        expect(birdCls).toBeTruthy();
        // extends Animal, implements Flyable
        const birdSuperInheritances = birdCls.superInheritances;
        expect(birdSuperInheritances.length).toBe(2);
        const extendsRef = birdSuperInheritances.filter(si => (si.ref === animalCls.ref));
        expect(extendsRef).toBeTruthy();
        const interfaceRef = birdSuperInheritances.filter(si => (si.ref === flyableInterface.ref));
        expect(interfaceRef).toBeTruthy();
    });
});
