import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { ParameterType, ParameterizableClass } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/parametrizableClass.ts",
`class ClassA<subGeneric extends supGeneric> {
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for inheritance parameter', () => {

    const jsonOutput = fmxRep.getJSON();
    const idToElementMap = fmxRep._initMapFromModel(jsonOutput);    
    
    it("should contain a parameter subGeneric who has a superclass supGeneric", () => {
        const classA = Array.from(fmxRep._getAllEntitiesWithType("ParameterizableClass") as Set<ParameterizableClass>).find(v => v.getName() === "ClassA");
        expect(classA).toBeTruthy();

        const param = classA?.getParameterTypes();
        
        param?.forEach(parameter => {
            // Utilisez parameter ici
            console.log(parameter);
        });
        

        let firstParameter = param?.values().next().value;
        expect(firstParameter?.getName()).toBe('subGeneric');

    });
    
});