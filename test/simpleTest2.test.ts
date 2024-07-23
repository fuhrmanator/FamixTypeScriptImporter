import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Access } from '../src/lib/famix/src/model/famix/access';
import { ScriptEntity } from '../src/lib/famix/src/model/famix/script_entity';
import { Variable } from '../src/lib/famix/src/model/famix/variable';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);
project.createSourceFile("/simpleTest2.ts",
`var a: number = 10;
    
console.log(a);
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for simple test 2', () => {
    
    const scriptEntityList = Array.from(fmxRep._getAllEntitiesWithType('ScriptEntity')) as Array<ScriptEntity>;
    const theFile = scriptEntityList.find(e => e.getName() === 'simpleTest2.ts');
    it("should have one file", () => {
        expect(scriptEntityList?.length).toBe(1);
        expect(theFile).toBeTruthy();
    });

    const variableList = Array.from(fmxRep._getAllEntitiesWithType('Variable')) as Array<Variable>;
    const theVariable = variableList.find(e => e.getName() === 'a');
    it("should have one variable", () => {
        expect(scriptEntityList?.length).toBe(1);
        expect(theVariable).toBeTruthy();
    });
    
    const accessList = Array.from(fmxRep._getAllEntitiesWithType('Access')) as Array<Access>;
    const theAccess = accessList.find(e => e.getVariable() === theVariable && e.getAccessor() === theFile);
    it("should have one access", () => {
        expect(accessList?.length).toBe(1);
        expect(theAccess).toBeTruthy();
    });   
});
