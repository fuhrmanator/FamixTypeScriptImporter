import { Project } from 'ts-morph';
import { importResolutions, resolveImport } from '../src/analyze_functions/importResolver';
import { createSourceFileMap } from './importExportTestCases';

// Create a new project
const project = new Project();
const sourceFileMap = createSourceFileMap(project);

describe('resolveImport', () => {

  beforeEach(() => {
    // Reset importResolutions before each test case, clear all key-value pairs
    Object.keys(importResolutions).forEach(key => {
      delete importResolutions[key];
    });
  });

  it("should import and use a named export", () => {
    const importerModule = sourceFileMap.get('importBasicExport')!;
    const importDeclaration = importerModule.getImportDeclarations()[0];
    expect(importDeclaration).toBeDefined();

    const importName = importDeclaration.getImportClauseOrThrow().getNamedImports()[0].getName();
    expect(importName).toEqual('variable1');

    resolveImport(importerModule, importDeclaration, importName);

    const exporterModule = sourceFileMap.get('basicExport')!;
    expect(exporterModule).toBeDefined();
    expect(importResolutions[importName]).toEqual([{ exportModulePath: exporterModule.getFilePath(), importName }]);
  });

  it("should import and use a default export", () => {
    // Test code for importing and using a default export
    const importerModule = sourceFileMap.get('importDefaultExport')!;
    const importDeclaration = importerModule.getImportDeclarations()[0];
    expect(importDeclaration).toBeDefined();
    const importName = importDeclaration.getDefaultImport()!.getText();
    expect(importName).toEqual('greetFunction');

    resolveImport(importerModule, importDeclaration, importName);

    const exporterModule = sourceFileMap.get('defaultExport')!;
    expect(exporterModule).toBeDefined();
    expect(importResolutions[importName]).toEqual([{ exportModulePath: exporterModule.getFilePath(), importName }]);
  });

  it("should import and use multiple named exports", () => {
    // Test code for importing and using multiple named exports
    const importerModule = sourceFileMap.get('importNamedExports')!;
    const importDeclaration = importerModule.getImportDeclarations()[0];
    expect(importDeclaration).toBeDefined();

    const importName0 = importDeclaration.getNamedImports()[0].getName();
    expect(importName0).toEqual('namedExport1');
    const importName1 = importDeclaration.getNamedImports()[1].getName();
    expect(importName1).toEqual('namedExport2');

    const exporterModule = sourceFileMap.get('namedExports')!;
    expect(exporterModule).toBeDefined();

    resolveImport(importerModule, importDeclaration, importName0);
    expect(importResolutions[importName0])
      .toEqual([{ exportModulePath: exporterModule.getFilePath(), importName: importName0 }]);

    resolveImport(importerModule, importDeclaration, importName1);
    expect(importResolutions[importName1])
      .toEqual([{ exportModulePath: exporterModule.getFilePath(), importName: importName1 }]);
  });

  it("should re-export and import a named export", () => {
    const importerModule = sourceFileMap.get('importRenamedNamedExport')!;
    const importDeclaration = importerModule.getImportDeclarations()[0];
    expect(importDeclaration).toBeDefined();

    const importName = importDeclaration.getNamedImports()[0].getName();
    expect(importName).toEqual('renamedExport');
    
    const exporterModule = sourceFileMap.get('reexportNamedExport')!;
    expect(exporterModule).toBeDefined();

    resolveImport(importerModule, importDeclaration, importName);
    expect(importResolutions[importName])
      .toEqual([{ exportModulePath: exporterModule.getFilePath(), importName: importName }]);
  });

  it("should re-export and import a default export", () => {
    const importerModule = sourceFileMap.get('importReexportDefaultExport')!;
    const importDeclaration = importerModule.getImportDeclarations()[0];
    expect(importDeclaration).toBeDefined();

    const importName = importDeclaration.getDefaultImport()!.getText();
    expect(importName).toEqual('greetFunction');

    const exporterModule = sourceFileMap.get('reexportDefaultExport')!;
    expect(exporterModule).toBeDefined();

    resolveImport(importerModule, importDeclaration, importName);
    expect(importResolutions[importName])
      .toEqual([{ exportModulePath: exporterModule.getFilePath(), importName: importName }]);
  });

  it("should handle import from within a namespace", () => {
    const importerModule = sourceFileMap.get('importWithinNamespace')!;
    const importDeclaration = importerModule.getImportDeclarations()[0];
    expect(importDeclaration).toBeDefined();

    const importName = importDeclaration.getNamedImports()[0].getName();
    expect(importName).toEqual('greet');

    const exporterModule = sourceFileMap.get('exportWithinNamespace')!;
    expect(exporterModule).toBeDefined();

    resolveImport(importerModule, importDeclaration, importName);

    expect(importResolutions[importName])
      .toEqual([{ exportModulePath: exporterModule.getFilePath(), importName: importName }]);
  });

  it("should handle import from third-party libraries", () => {
    // Test code for importing from third-party libraries
    const importerModule = sourceFileMap.get('importThirdParty')!;
    const importDeclaration = importerModule.getImportDeclarations()[0];
    expect(importDeclaration).toBeDefined();

    const importName = importDeclaration.getNamedImports()[0].getName();
    expect(importName).toEqual('isString');

    resolveImport(importerModule, importDeclaration, importName);

    expect(importResolutions[importName]).toEqual([{ exportModulePath: importName, importName: importName }]);
  });

  // it("should handle import from a non-existent module", () => {
  // });

  // it("should handle import of a non-existent export", () => {
  //   // Test code for handling import of a non-existent export
  // });

  // it("should handle circular dependencies", () => {
  //   // Test code for handling circular dependencies
  // });

  // it("should handle type checking of imported values", () => {
  //   // Test code for type checking of imported values
  // });

  // it("should handle code splitting and tree shaking", () => {
  //   // Test code for code splitting and tree shaking
  // });
  
});
