import { Importer } from '../src/analyze';
import { Access } from '../src/lib/famix/src/model/famix/access';
import { ScriptEntity } from '../src/lib/famix/src/model/famix/script_entity';
import { Variable } from '../src/lib/famix/src/model/famix/variable';
import { project } from './testUtils';

const importer = new Importer();
project.createSourceFile("/simpleTest2.ts",
`var a: number = 10;
    
console.log(a);
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for simple test 2', () => {
    
    const scriptEntityList = Array.from(fmxRep._getAllEntitiesWithType('ScriptEntity')) as Array<ScriptEntity>;
    const theFile = scriptEntityList.find(e => e.name === 'simpleTest2.ts');
    it("should have one file", () => {
        expect(scriptEntityList?.length).toBe(1);
        expect(theFile).toBeTruthy();
    });

    const variableList = Array.from(fmxRep._getAllEntitiesWithType('Variable')) as Array<Variable>;
    const theVariable = variableList.find(e => e.name === 'a');
    it("should have one variable", () => {
        expect(scriptEntityList?.length).toBe(1);
        expect(theVariable).toBeTruthy();
    });
    
    const accessList = Array.from(fmxRep._getAllEntitiesWithType('Access')) as Array<Access>;
    const theAccess = accessList.find(e => e.variable === theVariable && e.accessor === theFile);
    it("should have one access", () => {
        expect(accessList?.length).toBe(1);
        expect(theAccess).toBeTruthy();
    });   
});
