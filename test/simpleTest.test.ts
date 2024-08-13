import { Importer } from '../src/analyze';
import { ScriptEntity } from '../src/lib/famix/src/model/famix/script_entity';
import { project } from './testUtils';

const importer = new Importer();
project.createSourceFile("/simpleTest.ts",
`console.log("Hello");
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for simple test', () => {
    
    const scriptEntityList = Array.from(fmxRep._getAllEntitiesWithType('ScriptEntity')) as Array<ScriptEntity>;
    const theFile = scriptEntityList.find(e => e.name === 'simpleTest.ts');
    it("should have one file", () => {
        expect(scriptEntityList?.length).toBe(1);
        expect(theFile).toBeTruthy();
    });
});
