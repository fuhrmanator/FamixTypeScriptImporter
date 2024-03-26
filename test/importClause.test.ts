import { Project } from "ts-morph";
import { Importer, logger } from "../src/analyze";
import { Class, ImportClause, IndexedFileAnchor, Module, NamedEntity } from "../src/lib/famix/src/model/famix";
import { getTextFromAnchor } from "./testUtils";

const importer = new Importer();
logger.settings.minLevel = 0; // all your messages are belong to us
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./test_src"
        }
    }
);

project.createSourceFile("./test_src/oneClassExporter.ts",
    `export class ExportedClass {}`);

project.createSourceFile("./test_src/oneClassImporter.ts",
    `import {ExportedClass} from "./oneClassExport";`);

project.createSourceFile("./test_src/complexExportModule.ts",
    `class ClassZ {}
class ClassY {}
export class ClassX {}

export { ClassZ, ClassY };
export { Importer } from '../src/analyze';

export default class ClassW {}

export namespace Nsp {}
`);

project.createSourceFile("./test_src/defaultImporterModule.ts",
    `import * as test from "./complexExportModule.ts";`);

project.createSourceFile("./test_src/multipleClassImporterModule.ts",
    `import { ClassZ } from "./complexExportModule.ts";`);

project.createSourceFile("./test_src/reExporterModule.ts",
    `export * from "./complexExportModule.ts";`);

project.createSourceFile("./test_src/reImporterModule.ts",
    `import { ClassX } from "./reExporterModule.ts";`);

project.createSourceFile("./test_src/renameDefaultExportImporter.ts",
    `import myRenamedDefaultClassW from "./complexExportModule.ts";`);


const fmxRep = importer.famixRepFromProject(project);
const NUMBER_OF_MODULES = 8,
      NUMBER_OF_IMPORT_CLAUSES = 5;

const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
const entityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<NamedEntity>;

describe('Tests for import clauses', () => {
    it(`should have ${NUMBER_OF_MODULES} modules`, () => {
        expect(moduleList?.length).toBe(NUMBER_OF_MODULES);
        const exporterModule = moduleList.find(e => e.getName() === 'oneClassExporter.ts');
        expect(exporterModule).toBeTruthy();
        const importerModule = moduleList.find(e => e.getName() === 'oneClassImporter.ts');
        expect(importerModule).toBeTruthy();
        const complexModule = moduleList.find(e => e.getName() === 'complexExportModule.ts');
        expect(complexModule).toBeTruthy();
        // add the expects for the modules defaultImporterModule, multipleClassImporterModule, reExporterModule, reImporterModule, renameDefaultExportImporter
        const defaultImporterModule = moduleList.find(e => e.getName() === 'defaultImporterModule.ts');
        expect(defaultImporterModule).toBeTruthy();
        const multipleClassImporterModule = moduleList.find(e => e.getName() === 'multipleClassImporterModule.ts');
        expect(multipleClassImporterModule).toBeTruthy();
        const reExporterModule = moduleList.find(e => e.getName() === 'reExporterModule.ts');
        expect(reExporterModule).toBeTruthy();
        const reImporterModule = moduleList.find(e => e.getName() === 'reImporterModule.ts');
        expect(reImporterModule).toBeTruthy();
        const renameDefaultExportImporter = moduleList.find(e => e.getName() === 'renameDefaultExportImporter.ts');
        expect(renameDefaultExportImporter).toBeTruthy();
    });

    it(`should have ${NUMBER_OF_IMPORT_CLAUSES} import clauses`, () => {
        expect(importClauses).toBeTruthy();
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
    });

    it("should import myRenamedDefaultClassW that is a renamed ClassW from module complexExportModule.ts", () => {
        // find the import clause for ClassW
        const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'myRenamedDefaultClassW');
        expect(importClause).toBeTruthy();
        // expect the imported entity to be ClassW
        const importedEntity = importClause?.getImportedEntity() as Class;
        expect(importedEntity?.getName()).toBe("myRenamedDefaultClassW");
        // importing entity is renameDefaultExportImporter.ts
        const importingEntity = importClause?.getImportingEntity();
        expect(importingEntity).toBeTruthy();
        expect(importingEntity?.getName()).toBe("renameDefaultExportImporter.ts");
    });

    it("should import ClassX from module that exports from an import", () => {
        // find the import clause for ClassX
        const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'ClassX');
        expect(importClause).toBeTruthy();
        // importing entity is reImporterModule.ts
        expect(importClause?.getImportingEntity()).toBeTruthy();
        expect(importClause?.getImportingEntity()?.getName()).toBe("reImporterModule.ts");
    });

    it("should import ClassZ from module complexExporterModule.ts", () => {
        // find the import clause for ClassZ
        const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'ClassZ');
        expect(importClause).toBeTruthy();
        // importing entity is multipleClassImporterModule.ts
        expect(importClause?.getImportingEntity()).toBeTruthy();
        expect(importClause?.getImportingEntity()?.getName()).toBe("multipleClassImporterModule.ts");
    });

    it("should have a default import clause for test", () => {
        expect(importClauses).toBeTruthy();
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        // find the import clause for ClassW
        const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'test');
        expect(importClause).toBeTruthy();
        // importing entity is complexExportModule.ts
        expect(importClause?.getImportingEntity()).toBeTruthy();
        expect(importClause?.getImportingEntity()?.getName()).toBe("defaultImporterModule.ts");
    });

    it("should contain an import clause for ExportedClass", () => {
        expect(importClauses).toBeTruthy();
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'test');
        expect(importClause).toBeTruthy();
        // importing entity is oneClassImporter.ts
        expect(importClause?.getImportingEntity()).toBeTruthy();
        expect(importClause?.getImportingEntity()?.getName()).toBe("defaultImporterModule.ts");
    });

    it("should contain one outgoingImports element for module oneClassImporter.ts", () => {
        const importerModule = moduleList.find(e => e.getName() === 'oneClassImporter.ts');
        expect(importerModule).toBeTruthy();
        expect(importerModule?.getOutgoingImports()).toBeTruthy();
        expect(importerModule?.getOutgoingImports()?.size).toBe(1);
        expect(importerModule?.getOutgoingImports()?.values().next().value.getImportedEntity()?.getName()).toBe("ExportedClass");
    });

    it("should contain one imports element for module oneClassExporter.ts", () => {
        const exportedEntity = entityList.find(e => e.getName() === 'ExportedClass');
        expect(exportedEntity).toBeTruthy();
        expect(exportedEntity?.getIncomingImports()).toBeTruthy();
        expect(exportedEntity?.getIncomingImports()?.size).toBe(1);
        expect(exportedEntity?.getIncomingImports()?.values().next().value.getImportingEntity()?.getName()).toBe("oneClassImporter.ts");
    });

    it("should have import clauses with source code anchors", () => {
        // expect the import clause from renameDefaultExportImporter.ts to have a source anchor for ""
        const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'myRenamedDefaultClassW');
        expect(importClause).toBeTruthy();
        const fileAnchor = importClause?.getSourceAnchor() as IndexedFileAnchor;
        expect(fileAnchor).toBeTruthy();
        const fileName = fileAnchor?.getFileName().split("/").pop();
        expect(fileName).toBe("renameDefaultExportImporter.ts");
        // expect the text from the file anchor to be ""
        expect(getTextFromAnchor(fileAnchor, project)).toBe(`import myRenamedDefaultClassW from "./complexExportModule.ts";`);
    });
});