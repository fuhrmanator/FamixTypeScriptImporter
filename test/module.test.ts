import { Importer, logger } from '../src/analyze';
import { Module } from '../src/lib/famix/src/model/famix/module';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/test_src/moduleBecauseExports.ts", `
class ClassZ {}
class ClassY {}
export class ClassX {}

export { ClassZ, ClassY };
export { Importer } from '../src/analyze';

export default class ClassW {}

export namespace Nsp {}
`);

project.createSourceFile("/test_src/moduleBecauseImports.ts", `
import * as Famix from "../src/lib/famix/src/model/famix";
import { ClassDeclaration, ConstructorDeclaration } from "ts-morph";
import { Importer } from "../test_src/sampleForModule";
import { ClassZ } from "../test_src/sampleForModule";
import Cls from "../test_src/sampleForModule";
import { Nsp } from "../test_src/moduleBecauseExports";
import * as express from "express";
`);
    
project.createSourceFile("/test_src/moduleImportFromFileWithExtension.ts", `
import { ClassX } from "express.ts";
import * as test from "./sampleForModule.ts";
`);

project.createSourceFile("/test_src/ambientModule.d.ts", `
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
    const moduleBecauseExports = moduleList.find(e => e.name === 'moduleBecauseExports.ts');
    const moduleBecauseImports = moduleList.find(e => e.name === 'moduleBecauseImports.ts');
    const moduleImportFromFileWithExtension = moduleList.find(e => e.name === 'moduleImportFromFileWithExtension.ts');
    const ambientModule = moduleList.find(e => e.name === '"module-a"');
    const exportedNsp = moduleList.find(e => e.name === 'Nsp');
    it("should have five modules", () => {
        expect(moduleList?.length).toBe(5);
        expect(moduleBecauseExports).toBeTruthy();
        expect(moduleBecauseImports).toBeTruthy();
        expect(moduleImportFromFileWithExtension).toBeTruthy();
        expect(ambientModule).toBeTruthy();
        expect(exportedNsp).toBeTruthy();
    });

    it("should have a module with isAmbient property set to true", () => {
        expect(ambientModule?.isAmbient).toBeTruthy();
        expect(ambientModule?.isModule).toBeFalsy();
        expect(ambientModule?.isNamespace).toBeFalsy();
    });

    it("should have a module with isNamespace property set to true", () => {
        expect(exportedNsp?.isNamespace).toBeTruthy();
        expect(exportedNsp?.isModule).toBeFalsy();
        expect(exportedNsp?.isAmbient).toBeFalsy();
    });

    it("should have modules with isModule property set to true", () => {
        expect(moduleBecauseExports?.isModule).toBeTruthy();
        expect(moduleBecauseExports?.isAmbient).toBeFalsy();
        expect(moduleBecauseExports?.isNamespace).toBeFalsy();

        expect(moduleBecauseImports?.isModule).toBeTruthy();
        expect(moduleBecauseImports?.isAmbient).toBeFalsy();
        expect(moduleBecauseImports?.isNamespace).toBeFalsy();

        expect(moduleImportFromFileWithExtension?.isModule).toBeTruthy();
        expect(moduleImportFromFileWithExtension?.isAmbient).toBeFalsy();
        expect(moduleImportFromFileWithExtension?.isNamespace).toBeFalsy();

    });

});
