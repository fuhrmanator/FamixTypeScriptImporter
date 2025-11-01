import { Class, ImportClause, Interface, Module, NamedEntity, StructuralEntity } from '../src';
import { Importer } from '../src/analyze';
import { createProject } from './testUtils';

describe('Import Clause Namespace Imports', () => {
    it("should work with namespace imports", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/exportingFile.ts",
            `export class Animal {}
        `);

        project.createSourceFile("/importingFile.ts",
            `import * as Utils from './exportingFile';
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 2;
        const NUMBER_OF_IMPORT_CLAUSES = 1;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_CLASSES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<NamedEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(importClauses[0].importedEntity.fullyQualifiedName).toBe(classesList[0].fullyQualifiedName);
        expect(importClauses[0].importingEntity?.name).toBe('importingFile.ts');
    });

    it("should work with namespace imports when exported class and interface", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/exportingFile.ts",
            `export class Helper {}
            export interface Utils {}
        `);

        project.createSourceFile("/importingFile.ts",
            `import * as MyUtils from './exportingFile';
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 2;
        const NUMBER_OF_IMPORT_CLAUSES = 2;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_CLASSES = 1;
        const NUMBER_OF_INTERFACES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<NamedEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;
        const interfaceList = Array.from(fmxRep._getAllEntitiesWithType('Interface')) as Array<Interface>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(interfaceList.length).toBe(NUMBER_OF_INTERFACES);
        expect(importClauses[0].importingEntity?.name).toBe('importingFile.ts');
    });

    it("should work with namespace imports when module has no exports", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/exportingFile.ts",
            `class Animal {}
        `);

        project.createSourceFile("/importingFile.ts",
            `import * as Utils from './exportingFile';
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 1;
        const NUMBER_OF_IMPORT_CLAUSES = 1;
        const NUMBER_OF_STUB_ENTITIES = 1;
        const NUMBER_OF_CLASSES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<NamedEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(importClauses[0].importingEntity?.name).toBe('importingFile.ts');
    });

    it("should work with namespace import and named re-exports", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/baseModule.ts",
            `export class BaseClass {}
            export interface BaseInterface {}
        `);

        project.createSourceFile("/exportingFile.ts",
            `export { BaseClass } from './baseModule';
            export { BaseInterface } from './baseModule';
        `);

        project.createSourceFile("/importingFile.ts",
            `import * as AllUtils from './exportingFile';
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 3;
        const NUMBER_OF_IMPORT_CLAUSES = 4;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_CLASSES = 1;
        const NUMBER_OF_INTERFACES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<StructuralEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;
        const interfacesList = Array.from(fmxRep._getAllEntitiesWithType('Interface')) as Array<Interface>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(interfacesList.length).toBe(NUMBER_OF_INTERFACES);
    });

    it("should work with 3 files chain namespace re-exports", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/baseModule.ts",
            `export class BaseClass {}
            export interface BaseInterface {}
        `);

        project.createSourceFile("/exportingFile.ts",
            `export * from './baseModule';
            export class AdditionalClass {}
        `);

        project.createSourceFile("/importingFile.ts",
            `import * as AllUtils from './exportingFile';
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 3;
        const NUMBER_OF_IMPORT_CLAUSES = 5;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_CLASSES = 2;
        const NUMBER_OF_INTERFACES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<StructuralEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;
        const interfacesList = Array.from(fmxRep._getAllEntitiesWithType('Interface')) as Array<Interface>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(interfacesList.length).toBe(NUMBER_OF_INTERFACES);
    });

    it("should work with 5 files chain namespace re-exports", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/baseModule.ts",
            `export class BaseClass {}
            export interface BaseInterface {}
        `);

        project.createSourceFile("/exportingFile1.ts",
            `export * from './baseModule';
            export class AdditionalClass {}
        `);

        project.createSourceFile("/exportingFile2.ts",
            `export * from './exportingFile1';
        `);

        project.createSourceFile("/exportingFile3.ts",
            `export * from './exportingFile2';
        `);

        project.createSourceFile("/importingFile.ts",
            `import * as AllUtils from './exportingFile3';
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 5;
        const NUMBER_OF_IMPORT_CLAUSES = 11;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_CLASSES = 2;
        const NUMBER_OF_INTERFACES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<StructuralEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;
        const interfacesList = Array.from(fmxRep._getAllEntitiesWithType('Interface')) as Array<Interface>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(interfacesList.length).toBe(NUMBER_OF_INTERFACES);
    });


    it("should work with 5 files broken chain namespace re-exports", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/baseModule.ts",
            `export class BaseClass {}
            export interface BaseInterface {}
        `);

        project.createSourceFile("/exportingFile1.ts",
            `export * from './baseModule';
            export class AdditionalClass {}
        `);

        project.createSourceFile("/exportingFile2.ts", ``);

        project.createSourceFile("/exportingFile3.ts",
            `export * from './exportingFile2';
        `);

        project.createSourceFile("/importingFile.ts",
            `import * as AllUtils from './exportingFile3';
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 4;
        const NUMBER_OF_IMPORT_CLAUSES = 4;
        const NUMBER_OF_STUB_ENTITIES = 2;
        const NUMBER_OF_CLASSES = 2;
        const NUMBER_OF_INTERFACES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<StructuralEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;
        const interfacesList = Array.from(fmxRep._getAllEntitiesWithType('Interface')) as Array<Interface>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(interfacesList.length).toBe(NUMBER_OF_INTERFACES);
    });
});