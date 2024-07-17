import { Project } from 'ts-morph';
import { Importer, logger } from '../src/analyze';
import { ImportClause } from '../src/lib/famix/src/model/famix/import_clause';
import { Module } from '../src/lib/famix/src/model/famix/module';

const importer = new Importer();
const project = new Project({
    compilerOptions: {
        baseUrl: "./test_src"
    }
});

project.createSourceFile("./test_src/moduleBecauseExports.ts", `
class ClassZ {}
class ClassY {}
export class ClassX {}

export { ClassZ, ClassY };
export { Importer } from '../src/analyze';

export default class ClassW {}

export namespace Nsp {}
`);

project.createSourceFile("./test_src/moduleBecauseImports.ts", `
import * as Famix from "../src/lib/famix/src/model/famix";
import { ClassDeclaration, ConstructorDeclaration } from "ts-morph";
import { Importer } from "../test_src/sampleForModule";
import { ClassZ } from "../test_src/sampleForModule";
import Cls from "../test_src/sampleForModule";
import { Nsp } from "../test_src/moduleBecauseExports";
import * as express from "express";
`);
    
project.createSourceFile("./test_src/moduleImportFromFileWithExtension.ts", `
import { ClassX } from "express.ts";
import * as test from "./sampleForModule.ts";
`);

project.createSourceFile("./test_src/ambientModule.d.ts", `
declare module "module-a" {
    export class ClassA {}
}
`);

logger.settings.minLevel = 0; // all your messages are belong to us

        
// const filePaths = new Array<string>();
// filePaths.push("test_src/sampleForModule.ts");
// filePaths.push("test_src/sampleForModule2.ts");
// filePaths.push("test_src/sampleForModule3.ts");

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for module', () => {
    
    const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
    const moduleBecauseExports = moduleList.find(e => e.getName() === 'moduleBecauseExports.ts');
    const moduleBecauseImports = moduleList.find(e => e.getName() === 'moduleBecauseImports.ts');
    const moduleImportFromFileWithExtension = moduleList.find(e => e.getName() === 'moduleImportFromFileWithExtension.ts');
    const ambientModule = moduleList.find(e => e.getName() === '"module-a"');
    const exportedNsp = moduleList.find(e => e.getName() === 'Nsp');
    it("should have five modules", () => {
        expect(moduleList?.length).toBe(5);
        expect(moduleBecauseExports).toBeTruthy();
        expect(moduleBecauseImports).toBeTruthy();
        expect(moduleImportFromFileWithExtension).toBeTruthy();
        expect(ambientModule).toBeTruthy();
        expect(exportedNsp).toBeTruthy();
    });

});
