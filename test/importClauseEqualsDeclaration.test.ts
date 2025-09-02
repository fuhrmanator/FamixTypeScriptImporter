import { Class, ImportClause, Module, StructuralEntity } from '../src';
import { Function as FamixFunction } from '../src/lib/famix/model/famix/function';
import { Importer } from '../src/analyze';
import { createProject } from './testUtils';

// TODO: 🛠️ Fix code to pass the tests and remove .skip

describe.skip('Import Clause Equals Declarations', () => {
    it("should work with import equals declaration for exported class", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/exportingFile.ts",
            `export default class Animal {}
        `);

        project.createSourceFile("/importingFile.ts",
            `import Animal = require('./exportingFile');
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 2;
        const NUMBER_OF_IMPORT_CLAUSES = 1;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_CLASSES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('StructuralEntity')) as Array<StructuralEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(importClauses[0].importedEntity.fullyQualifiedName).toBe(classesList[0].fullyQualifiedName);
    });

    it("should work with import equals declaration for exported namespace", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/exportingFile.ts",
            `export namespace Utils {
                export function helper() {}
            }
        `);

        project.createSourceFile("/importingFile.ts",
            `import Utils = require('./exportingFile');
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 2;
        const NUMBER_OF_IMPORT_CLAUSES = 1;
        const NUMBER_OF_STUB_ENTITIES = 0;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('StructuralEntity')) as Array<StructuralEntity>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(importClauses[0].importedEntity.name).toBe('Utils');
    });

    it("should work with import equals declaration when the entity is not exported", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/exportingFile.ts",
            `class Animal {}
        `);

        project.createSourceFile("/importingFile.ts",
            `import Animal = require('./exportingFile');
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 1;
        const NUMBER_OF_IMPORT_CLAUSES = 1;
        const NUMBER_OF_STUB_ENTITIES = 1;
        const NUMBER_OF_CLASSES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('StructuralEntity')) as Array<StructuralEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(importClauses[0].importedEntity.fullyQualifiedName).not.toBe(classesList[0].fullyQualifiedName);
    });

    it("should work with multiple import equals declarations", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/moduleA.ts",
            `export default class ClassA {}
        `);

        project.createSourceFile("/moduleB.ts",
            `export namespace UtilsB {
                export function helper() {}
            }
        `);

        project.createSourceFile("/importingFile.ts",
            `import ClassA = require('./moduleA');
            import UtilsB = require('./moduleB');
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 3;
        const NUMBER_OF_IMPORT_CLAUSES = 2;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_CLASSES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('StructuralEntity')) as Array<StructuralEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        
        const classAImport = importClauses.find(ic => ic.importedEntity.name === 'ClassA');
        const utilsBImport = importClauses.find(ic => ic.importedEntity.name === 'UtilsB');
        
        expect(classAImport).toBeTruthy();
        expect(utilsBImport).toBeTruthy();
        expect(classAImport?.importingEntity?.name).toBe('importingFile.ts');
        expect(utilsBImport?.importingEntity?.name).toBe('importingFile.ts');
    });

    // TODO: how should we handle this case?
    it("should work with import equals declaration for mixed export types", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/mixedExports.ts",
            `export class ExportedClass {}
            export const exportedVariable = 42;
            export function exportedFunction() {}
        `);

        project.createSourceFile("/importingFile.ts",
            `import MixedModule = require('./mixedExports');
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 2;
        const NUMBER_OF_IMPORT_CLAUSES = 1;
        const NUMBER_OF_STUB_ENTITIES = 0;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('StructuralEntity')) as Array<StructuralEntity>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(importClauses[0].importedEntity.name).toBe('MixedModule');
        expect(importClauses[0].importingEntity?.name).toBe('importingFile.ts');
    });
    
    // NOTE: So when you type const x = require('x'), TypeScript is going to complain that it doesn't know what require is. 
    // You need to install @types/node package to install type definitions for the CommonJS module system 
    // in order to work with it from the TypeScript.

    // TODO: the files with only require statement should be a module??? (it does not have import/export but it is still a module?)
    // There should be import clauses for it
    it("should work with const require imports", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/maths.ts",
            `export function squareTwo() { return 4; }
            export function cubeThree() { return 27; }
            export const PI = 3.14;
        `);

        project.createSourceFile("/importingFile.ts",
            `const mathModule = require("./maths");
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 2;
        const NUMBER_OF_IMPORT_CLAUSES = 2;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_FUNCTIONS = 2;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('StructuralEntity')) as Array<StructuralEntity>;
        const functionsList = Array.from(fmxRep._getAllEntitiesWithType('Function')) as Array<FamixFunction>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(functionsList.length).toBe(NUMBER_OF_FUNCTIONS);
        
        // Check that the destructured imports reference the correct entities
        const squareTwoImport = importClauses.find(ic => ic.importedEntity.name === 'squareTwo');
        const cubeThreeImport = importClauses.find(ic => ic.importedEntity.name === 'cubeThree');
        
        expect(squareTwoImport).toBeTruthy();
        expect(cubeThreeImport).toBeTruthy();
        expect(squareTwoImport?.importingEntity?.name).toBe('importingFile.ts');
        expect(cubeThreeImport?.importingEntity?.name).toBe('importingFile.ts');
    });

    it("should work with destructuring require imports", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/maths.ts",
            `export function squareTwo() { return 4; }
            export function cubeThree() { return 27; }
            export const PI = 3.14;
        `);

        project.createSourceFile("/importingFile.ts",
            `const { squareTwo } = require("./maths");
            const { cubeThree, PI } = require("./maths");
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 2;
        const NUMBER_OF_IMPORT_CLAUSES = 2;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_FUNCTIONS = 2;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('StructuralEntity')) as Array<StructuralEntity>;
        const functionsList = Array.from(fmxRep._getAllEntitiesWithType('Function')) as Array<FamixFunction>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(functionsList.length).toBe(NUMBER_OF_FUNCTIONS);
        
        // Check that the destructured imports reference the correct entities
        const squareTwoImport = importClauses.find(ic => ic.importedEntity.name === 'squareTwo');
        const cubeThreeImport = importClauses.find(ic => ic.importedEntity.name === 'cubeThree');
        
        expect(squareTwoImport).toBeTruthy();
        expect(cubeThreeImport).toBeTruthy();
        expect(squareTwoImport?.importingEntity?.name).toBe('importingFile.ts');
        expect(cubeThreeImport?.importingEntity?.name).toBe('importingFile.ts');
    });

    it("should work with import equals declaration and re-export", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/originalFile.ts",
            `export default class Animal {}
        `);

        project.createSourceFile("/reExportingFile.ts",
            `export { default } from './originalFile';
        `);

        project.createSourceFile("/importingFile.ts",
            `import Animal = require('./reExportingFile');
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_MODULES = 3;
        const NUMBER_OF_IMPORT_CLAUSES = 1;
        const NUMBER_OF_STUB_ENTITIES = 0;
        const NUMBER_OF_CLASSES = 1;

        const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
        const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
        const stubEntityList = Array.from(fmxRep._getAllEntitiesWithType('StructuralEntity')) as Array<StructuralEntity>;
        const classesList = Array.from(fmxRep._getAllEntitiesWithType('Class')) as Array<Class>;

        expect(moduleList.length).toBe(NUMBER_OF_MODULES);
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        expect(stubEntityList.length).toBe(NUMBER_OF_STUB_ENTITIES);
        expect(classesList.length).toBe(NUMBER_OF_CLASSES);
        expect(importClauses[0].importedEntity.fullyQualifiedName).toBe(classesList[0].fullyQualifiedName);
    });
});