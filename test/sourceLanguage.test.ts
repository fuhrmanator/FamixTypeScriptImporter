import { Importer } from "../src/analyze";
import { SourceLanguage } from "../src/lib/famix/model/famix";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/simple.ts",
    `let a: number = 1;`);
const fmxRep = importer.famixRepFromProject(project);

describe('Tests for source language', () => {

    it("should have a source language entity whose name is TypeScript", () => {
        // find the FamixTypeScriptSourceLanguage entity
        const sourceLanguageSet = fmxRep._getAllEntitiesWithType("SourceLanguage");
        expect(sourceLanguageSet.size).toBe(1);
        // single element of the set should have a name property whose value is "TypeScript" (cast to SourceLanguage)
        const sourceLanguage = sourceLanguageSet.values().next().value as SourceLanguage;
        expect(sourceLanguage.name).toBe("TypeScript");
    });

});
