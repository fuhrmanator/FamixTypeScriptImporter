import { Project } from "ts-morph";
import { Importer, logger } from "../src/analyze";
import { ImportClause, IndexedFileAnchor, Module, Variable, Function as FamixFunction } from "../src/lib/famix/src/model/famix";
import { getTextFromAnchor } from "./testUtils";
import { createSourceFileMap } from "./importExportTestCases";

const project = new Project();
// const sourceFileMap = 
createSourceFileMap(project);

const importer = new Importer();
logger.settings.minLevel = 0; // all your messages are belong to us

const fmxRep = importer.famixRepFromProject(project);

const NUMBER_OF_MODULES = 13,
    NUMBER_OF_IMPORT_CLAUSES = 8;
const importClauses = Array.from(fmxRep._getAllEntitiesWithType("ImportClause")) as Array<ImportClause>;
const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
//const entityList = Array.from(fmxRep._getAllEntitiesWithType('NamedEntity')) as Array<NamedEntity>;
const variableList = Array.from(fmxRep._getAllEntitiesWithType('Variable')) as Array<Variable>;
const functionList = Array.from(fmxRep._getAllEntitiesWithType('Function')) as Array<FamixFunction>;

// find the modules from the project 
const basicExport = moduleList.find(e => e.getName() === 'basicExport.ts');
const defaultExport = moduleList.find(e => e.getName() === 'defaultExport.ts');
const namedExports = moduleList.find(e => e.getName() === 'namedExports.ts');
const reexportNamedExport = moduleList.find(e => e.getName() === 'reexportNamedExport.ts');
const exportWithinNamespace = moduleList.find(e => e.getName() === 'exportWithinNamespace.ts');
const reexportDefaultExport = moduleList.find(e => e.getName() === 'reexportDefaultExport.ts');

const importBasicExport = moduleList.find(e => e.getName() === 'importBasicExport.ts');
const importDefaultExport = moduleList.find(e => e.getName() === 'importDefaultExport.ts');
const importNamedExports = moduleList.find(e => e.getName() === 'importNamedExports.ts');
const importRenamedNamedExport = moduleList.find(e => e.getName() === 'importRenamedNamedExport.ts');
const importReexportDefaultExport = moduleList.find(e => e.getName() === 'importReexportDefaultExport.ts');
const importWithinNamespace = moduleList.find(e => e.getName() === 'importWithinNamespace.ts');
const importThirdParty = moduleList.find(e => e.getName() === 'importThirdParty.ts');

// create the import clauses from the project (importBasicExport, importDefaultExport, importNamedExports, importReexportNamedExport, importExportWithinNamespace, importThirdParty)
const importBasicExportClauseVariable1 = importClauses.find(e => e.getImportedEntity()?.getName() === 'variable1');
const importDefaultExportClauseGreetFunction = importClauses.find(e => e.getImportedEntity()?.getName() === 'greetFunction');
const importNamedExportsClauseNamedExport1 = importClauses.find(e => e.getImportedEntity()?.getName() === 'namedExport1');
const importNamedExportsClauseNamedExport2 = importClauses.find(e => e.getImportedEntity()?.getName() === 'namedExport2');
const importReexportNamedExportClauseRenamedExport = importClauses.find(e => e.getImportedEntity()?.getName() === 'renamedExport');
const importGreetFunctionReexportDefaultExport = importClauses.find(e => e.getImportedEntity()?.getName() === 'greetFunction');
const importExportWithinNamespaceClauseGreet = importClauses.find(e => e.getImportedEntity()?.getName() === 'greet');
const importIsStringFromLodash = importClauses.find(e => e.getImportedEntity()?.getName() === 'isString');

// create the entities for imported variables, functions, etc.
const variable1 = variableList.find(e => e.getName() === 'variable1');
const greetFunction = functionList.find(e => e.getName() === 'greetFunction');
const namedExport1 = variableList.find(e => e.getName() === 'namedExport1');
const namedExport2 = variableList.find(e => e.getName() === 'namedExport2');
const renamedExport = variableList.find(e => e.getName() === 'renamedExport');
const greet = functionList.find(e => e.getName() === 'greet');

describe('Tests for import clauses', () => {
    it(`should have ${NUMBER_OF_MODULES} modules`, () => {
        expect(moduleList?.length).toBe(NUMBER_OF_MODULES);
        // expect the modules to be defined
        expect(basicExport).toBeTruthy();
        expect(defaultExport).toBeTruthy();
        expect(namedExports).toBeTruthy();
        expect(reexportNamedExport).toBeTruthy();
        expect(exportWithinNamespace).toBeTruthy();
        expect(reexportDefaultExport).toBeTruthy();

        expect(importBasicExport).toBeTruthy();
        expect(importDefaultExport).toBeTruthy();
        expect(importNamedExports).toBeTruthy();
        expect(importRenamedNamedExport).toBeTruthy();
        expect(importReexportDefaultExport).toBeTruthy();
        expect(importWithinNamespace).toBeTruthy();
        expect(importThirdParty).toBeTruthy();
    });

    it("should have defined entities.", () => {
        expect(variable1).toBeTruthy();
        expect(greetFunction).toBeTruthy();
        expect(namedExport1).toBeTruthy();
        expect(namedExport2).toBeTruthy();
        expect(renamedExport).toBeTruthy();
        expect(greet).toBeTruthy();
        expect(greet).toBeTruthy();
    });

    it(`should have ${NUMBER_OF_IMPORT_CLAUSES} import clauses`, () => {
        expect(importClauses).toBeTruthy();
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        // expect the import clauses to be defined
        expect(importBasicExportClauseVariable1).toBeTruthy();
        expect(importDefaultExportClauseGreetFunction).toBeTruthy();
        expect(importNamedExportsClauseNamedExport1).toBeTruthy();
        expect(importNamedExportsClauseNamedExport2).toBeTruthy();
        expect(importReexportNamedExportClauseRenamedExport).toBeTruthy();
        expect(importGreetFunctionReexportDefaultExport).toBeTruthy();
        expect(importExportWithinNamespaceClauseGreet).toBeTruthy();
        expect(importIsStringFromLodash).toBeTruthy();
    });

    it("should import and use a named export", () => {
        // expect the importing entity to be basicExport.ts
        expect(importBasicExportClauseVariable1?.getImportingEntity().getName()).toBe(importBasicExport?.getName());
        // deeper...
        expect(importBasicExportClauseVariable1?.getImportingEntity()).toBe(importBasicExport);
        // expect the imported entity to be variable1
        expect(importBasicExportClauseVariable1?.getImportedEntity().getName()).toBe(variable1?.getName());
        expect(importBasicExportClauseVariable1?.getImportedEntity()).toBe(variable1);
    });

    it("should import and use a default export", () => {
        // expect the importing entity to be defaultExport.ts
        expect(importDefaultExportClauseGreetFunction?.getImportingEntity().getName()).toBe(importDefaultExport?.getName());
        // deeper...
        expect(importDefaultExportClauseGreetFunction?.getImportingEntity()).toBe(importDefaultExport);
        // expect the imported entity to be greetFunction
        expect(importDefaultExportClauseGreetFunction?.getImportedEntity().getName()).toBe(greetFunction?.getName());
        expect(importDefaultExportClauseGreetFunction?.getImportedEntity()).toBe(greetFunction);
    });

    it("should import and use multiple named exports", () => {
        expect(importNamedExportsClauseNamedExport1?.getImportingEntity().getName()).toBe(importNamedExports?.getName());
        // deeper...
        expect(importNamedExportsClauseNamedExport1?.getImportingEntity()).toBe(importNamedExports);
        expect(importNamedExportsClauseNamedExport1?.getImportedEntity().getName()).toBe(namedExport1?.getName());
        expect(importNamedExportsClauseNamedExport1?.getImportedEntity()).toBe(namedExport1);

        expect(importNamedExportsClauseNamedExport2?.getImportingEntity().getName()).toBe(importNamedExports?.getName());
        // deeper...
        expect(importNamedExportsClauseNamedExport2?.getImportingEntity()).toBe(importNamedExports);
        expect(importNamedExportsClauseNamedExport2?.getImportedEntity().getName()).toBe(namedExport2?.getName());
        expect(importNamedExportsClauseNamedExport2?.getImportedEntity()).toBe(namedExport2);
    });

    it("should re-export and import a named export", () => {
        expect(importReexportNamedExportClauseRenamedExport?.getImportingEntity().getName()).toBe(importRenamedNamedExport?.getName());
        // deeper...
        expect(importReexportNamedExportClauseRenamedExport?.getImportingEntity()).toBe(importRenamedNamedExport);
        expect(importReexportNamedExportClauseRenamedExport?.getImportedEntity().getName()).toBe(renamedExport?.getName());
        expect(importReexportNamedExportClauseRenamedExport?.getImportedEntity()).toBe(renamedExport);
    });
        
    // it("should import myRenamedDefaultClassW, a renamed ClassW from module complexExportModule.ts", () => {
    //     // find the import clause for ClassW
    //     const myRenamedImportClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'myRenamedDefaultClassW');
    //     expect(myRenamedImportClause).toBeTruthy();

    //     const importingEntity = myRenamedImportClause?.getImportingEntity();
    //     expect(importingEntity).toBeTruthy();
    //     expect(importingEntity).toBe(renameDefaultExportImporter);

    //     const importedEntity = myRenamedImportClause?.getImportedEntity() as Class;
    //     expect(importedEntity.getName()).toBe(classWFromComplexExportModule?.getName());
    // });

    // it("should contain a named import of ClassZ", () => {
    //     const importClause = importClauses.find(e => e.getImportedEntity() === classZFromComplexExportModule);
    //     expect(importClause).toBeTruthy();

    //     expect(importClause?.getImportingEntity()).toBe(multipleClassImporterModule);

    //     const importedEntity = importClause?.getImportedEntity() as Class;
    //     expect(importedEntity).toBeTruthy();
    //     expect(importedEntity).toBe(classZFromComplexExportModule);
    // });

    // it("should import RenamedDefaultClassW (ClassW from complex) from module that exports from an import", () => {
    //     // find the import clause for ClassX
    //     const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'RenamedDefaultClassW');
    //     expect(importClause).toBeTruthy();
    //     // importing entity is reImporterModule.ts
    //     expect(importClause?.getImportingEntity()).toBeTruthy();
    //     expect(importClause?.getImportingEntity()).toBe(reImporterModule);
    //     // imported entity is ClassW (default export from complexExportModule.ts)
    //     expect(importClause?.getImportedEntity()).toBeTruthy();
    //     // getName() is used for debugging
    //     expect(importClause?.getImportedEntity().getName()).toBe(classWFromComplexExportModule?.getName());
    // });

    it("should have a default import clause for test", () => {
        expect(importClauses).toBeTruthy();
        expect(importClauses.length).toBe(NUMBER_OF_IMPORT_CLAUSES);
        // find the import clause for ClassW
        const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'test');
        expect(importClause).toBeTruthy();
        // importing entity is complexExportModule.ts
        expect(importClause?.getImportingEntity()).toBeTruthy();
        // find defaultImporterModule.ts as a module
        const importerModule = moduleList.find(e => e.getName() === 'defaultImporterModule.ts');
        expect(importerModule).toBeTruthy();
        // expect the importing entity to be defaultImporterModule.ts
        expect(importClause?.getImportingEntity()).toBe(importerModule);
        // expect the ending of the fully qualified name (without quotes) to be defaultImporterModule.ts
    });

    // it("should contain a default import of ClassW", () => {
    //     const importClause = importClauses.find(e => e.getImportedEntity()?.getName() === 'test');
    //     expect(importClause).toBeTruthy();
    //     // importing entity is oneClassImporter.ts
    //     expect(importClause?.getImportingEntity()).toBeTruthy();
    //     expect(importClause?.getImportingEntity()?.getName()).toBe("defaultImporterModule.ts");

    //     // imported entity is ClassW (default export from complexExportModule.ts)
    //     expect(importClause?.getImportedEntity()).toBeTruthy();
    //     // find ClassW as a class
    //     const importedEntity = importClause?.getImportedEntity() as Class;
    //     expect(importedEntity).toBeTruthy();
    //     // expect the imported entity to be ClassW
    //     expect(classWFromComplexExportModule).toBeTruthy();
    //     expect(importedEntity.getName()).toBe(classWFromComplexExportModule?.getName());
    //     // should compare objects, but getName() is better for debugging
    // });

    it("should contain outgoingImports element for module importNamedExports.ts", () => {
        const importerModule = importNamedExports!;
        expect(importerModule?.getOutgoingImports()).toBeTruthy();
        expect(importerModule?.getOutgoingImports()?.size).toBe(2);  // namedExport1, namedExport2
        const outgoingImports = Array.from(importerModule.getOutgoingImports().values()) as Array<ImportClause>;
        expect(outgoingImports[0].getImportedEntity().getName()).toBe("namedExport1");
        expect(outgoingImports[1].getImportedEntity().getName()).toBe("namedExport2");
    });

    it("should contain one incomingImports for variable1", () => {
        const incomingImports = variable1!.getIncomingImports();
        expect(incomingImports).toBeTruthy();
        expect(incomingImports.size).toBe(1);
        expect(incomingImports.values().next().value.getImportingEntity()?.getName())
            .toBe("importBasicExport.ts");
    });

    it("should have import clauses with source code anchors", () => {
        const fileAnchor = importNamedExportsClauseNamedExport1?.getSourceAnchor() as IndexedFileAnchor;
        expect(fileAnchor).toBeTruthy();
        const fileName = fileAnchor?.getFileName().split("/").pop();
        expect(fileName).toBe("importNamedExports.ts");
        expect(getTextFromAnchor(fileAnchor, project))
            .toBe(`import { namedExport1, namedExport2 } from './namedExports';`);
    });
});