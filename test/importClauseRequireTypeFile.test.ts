import { Project } from "ts-morph";
import { Importer, logger } from "../src/analyze";
import { Class, ImportClause, IndexedFileAnchor, Module, NamedEntity, StructuralEntity } from "../src/lib/famix/src/model/famix";
import { getTextFromAnchor } from "./testUtils";

const importer = new Importer();
logger.settings.minLevel = 0; // all your messages are belong to us
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "."
        }
    }
);

project.createSourceFile("importInModule.d.ts",
`// Type definitions for express-flash-plus (modified from connect-flash by C. Fuhrman)
// Project: https://github.com/jaredhanson/connect-flash
// Definitions by: Andreas Gassmann <https://github.com/AndreasGassmann>
//                 Drew Lemmy <https://github.com/Lemmmy>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

/// <reference types="express" />

// declare namespace Express {
//     export interface Request {
//         flash(): { [key: string]: string[] };
//         flash(message: string): string[];
//         flash(type: string, message: string[] | string): number;
//         flash(type: string, format: string, ...args: any[]): number;
//     }
// }

declare module "express-flash-plus" {
    import express = require('express');
    interface IConnectFlashOptions {
        unsafe?: boolean | undefined;
    }
    function e(options?: IConnectFlashOptions): express.RequestHandler;
    export = e;
}`);

const fmxRep = importer.famixRepFromProject(project);
const NUMBER_OF_MODULES = 2,
      NUMBER_OF_IMPORT_CLAUSES = 1;

const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
const entityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<NamedEntity>;

describe('Tests for import clauses', () => {
    it(`should have ${NUMBER_OF_MODULES} modules`, () => {
        expect(moduleList?.length).toBe(NUMBER_OF_MODULES);
        const importInModule = moduleList.find(e => e.getName() === 'importInModule.ts');
        expect(importInModule).toBeTruthy();
    });

    // it(`should have ${NUMBER_OF_IMPORT_CLAUSES} import clauses`, () => {
    //     expect(importClauses).toBeTruthy();
    //     expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
    // });

    // it("should import myRenamedDefaultClassW that is a renamed ClassW from module complexExportModule.ts", () => {
    //     // find the import clause for ClassW
    //     const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'myRenamedDefaultClassW');
    //     expect(importClause).toBeTruthy();
    //     // expect the imported entity to be ClassW
    //     const importedEntity = importClause?.getImportedEntity() as Class;
    //     expect(importedEntity?.getName()).toBe("myRenamedDefaultClassW");
    //     // importing entity is renameDefaultExportImporter.ts
    //     const importingEntity = importClause?.getImportingEntity();
    //     expect(importingEntity).toBeTruthy();
    //     expect(importingEntity?.getName()).toBe("renameDefaultExportImporter.ts");
    // });

    // it("should import ClassX from module that exports from an import", () => {
    //     // find the import clause for ClassX
    //     const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'ClassX');
    //     expect(importClause).toBeTruthy();
    //     // importing entity is reImporterModule.ts
    //     expect(importClause?.getImportingEntity()).toBeTruthy();
    //     expect(importClause?.getImportingEntity()?.getName()).toBe("reImporterModule.ts");
    // });

    // it("should import ClassZ from module complexExporterModule.ts", () => {
    //     // find the import clause for ClassZ
    //     const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'ClassZ');
    //     expect(importClause).toBeTruthy();
    //     // importing entity is multipleClassImporterModule.ts
    //     expect(importClause?.getImportingEntity()).toBeTruthy();
    //     expect(importClause?.getImportingEntity()?.getName()).toBe("multipleClassImporterModule.ts");
    // });

    // it("should have a default import clause for test", () => {
    //     expect(importClauses).toBeTruthy();
    //     // find the import clause for ClassW
    //     const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'test');
    //     expect(importClause).toBeTruthy();
    //     // importing entity is complexExportModule.ts
    //     expect(importClause?.getImportingEntity()).toBeTruthy();
    //     expect(importClause?.getImportingEntity()?.getName()).toBe("defaultImporterModule.ts");
    // });

    // it("should contain an import clause for ExportedClass", () => {
    //     expect(importClauses).toBeTruthy();
    //     const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'test');
    //     expect(importClause).toBeTruthy();
    //     // importing entity is oneClassImporter.ts
    //     expect(importClause?.getImportingEntity()).toBeTruthy();
    //     expect(importClause?.getImportingEntity()?.getName()).toBe("defaultImporterModule.ts");
    // });

    // it("should contain one outgoingImports element for module oneClassImporter.ts", () => {
    //     const importerModule = moduleList.find(e => e.getName() === 'oneClassImporter.ts');
    //     expect(importerModule).toBeTruthy();
    //     expect(importerModule?.getOutgoingImports()).toBeTruthy();
    //     expect(importerModule?.getOutgoingImports()?.size).toBe(1);
    //     expect(importerModule?.getOutgoingImports()?.values().next().value.getImportedEntity()?.getName()).toBe("ExportedClass");
    // });

    // it("should contain one imports element for module oneClassExporter.ts", () => {
    //     const exportedEntity = entityList.find(e => e.getName() === 'ExportedClass');
    //     expect(exportedEntity).toBeTruthy();
    //     expect(exportedEntity?.getIncomingImports()).toBeTruthy();
    //     expect(exportedEntity?.getIncomingImports()?.size).toBe(1);
    //     expect(exportedEntity?.getIncomingImports()?.values().next().value.getImportingEntity()?.getName()).toBe("oneClassImporter.ts");
    // });

    // it("should have import clauses with source code anchors", () => {
    //     // expect the import clause from renameDefaultExportImporter.ts to have a source anchor for ""
    //     const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'myRenamedDefaultClassW');
    //     expect(importClause).toBeTruthy();
    //     const fileAnchor = importClause?.getSourceAnchor() as IndexedFileAnchor;
    //     expect(fileAnchor).toBeTruthy();
    //     const fileName = fileAnchor?.getFileName().split("/").pop();
    //     expect(fileName).toBe("renameDefaultExportImporter.ts");
    //     // expect the text from the file anchor to be ""
    //     expect(getTextFromAnchor(fileAnchor, project)).toBe(`import myRenamedDefaultClassW from "./complexExportModule.ts";`);
    // });

    // it("should have an import clause for require('foo')", () => {
    //     // find the import clause for foo
    //     const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'foo');
    //     expect(importClause).toBeTruthy();
    //     // importing entity is lazyRequireModuleCommonJS.ts
    //     expect(importClause?.getImportingEntity()).toBeTruthy();
    //     expect(importClause?.getImportingEntity()?.getName()).toBe("lazyRequireModuleCommonJS.ts");
    //     const fileAnchor = importClause?.getSourceAnchor() as IndexedFileAnchor;
    //     expect(getTextFromAnchor(fileAnchor, project)).toBe(`import foo = require('foo');`);
    //     // expect the type of the importedEntity to be "StructuralEntity"
    //     expect((importClause?.getImportedEntity().constructor.name)).toBe("StructuralEntity");
    //     // expect the type of foo to be any
    //     expect((importClause?.getImportedEntity() as StructuralEntity).getDeclaredType()?.getName()).toBe("any");
    // });

});
