import { Project, SourceFile } from 'ts-morph';
import { importResolutions, resolveImport } from '../src/analyze_functions/importResolver';

describe('resolveImport', () => {
  let project: Project;
  let sourceFileA: SourceFile;
  let sourceFileB: SourceFile;
  let sourceFileC: SourceFile;
  let sourceFileImporter: SourceFile;

  beforeEach(() => {
    // Reset importResolutions before each test case, clear all key-value pairs
    Object.keys(importResolutions).forEach(key => {
      delete importResolutions[key];
    });

    // Create a new project and source files for each test case
    project = new Project();
    sourceFileA = project.createSourceFile('A.ts', 'export const a = "Module A Variable";');
    sourceFileB = project.createSourceFile('B.ts', 'export const b = "Module B Variable";');
    sourceFileC = project.createSourceFile('C.ts', 'export const c = "Module C Variable";');
    sourceFileImporter = project.createSourceFile(
      'Importer.ts',
      `
      import defaultImport from './A';
      import * as namespaceImport from './B';
      import { c as namedImport } from './C';
      `
    );
  });

  it('should resolve default imports correctly', () => {
    const importDeclaration = sourceFileImporter.getImportDeclarations()[0]; // Get the first import declaration

    // Derive the imported name dynamically
    const importName = importDeclaration.getDefaultImport()!.getText();

    resolveImport(sourceFileImporter, importDeclaration, importName);

    expect(importResolutions[importName]).toEqual([{ modulePath: sourceFileA.getFilePath(), importName }]);
  });

  it('should resolve namespace imports correctly', () => {
    const importDeclaration = sourceFileImporter.getImportDeclarations()[1]; // Get the second import declaration

    // Derive the imported name dynamically
    const importName = importDeclaration.getNamespaceImport()!.getText();

    resolveImport(sourceFileImporter, importDeclaration, importName);

    expect(importResolutions[importName]).toEqual([{ modulePath: sourceFileB.getFilePath(), importName }]);
  });

  it('should resolve named imports correctly', () => {
    const importDeclaration = sourceFileImporter.getImportDeclarations()[2]; // Get the third import declaration

    // Derive the imported name dynamically
    const importName = importDeclaration.getNamedImports()[0].getName();

    resolveImport(sourceFileImporter, importDeclaration, importName);

    expect(importResolutions[importName]).toEqual([{ modulePath: sourceFileC.getFilePath(), importName }]);
  });

  it('should handle missing import declarations', () => {
    const importDeclarationMissing = sourceFileImporter.getImportDeclaration(importNode =>
      importNode.getModuleSpecifierValue() === './MissingModule'
    );

    resolveImport(sourceFileImporter, importDeclarationMissing, 'missingImport');

    expect(importResolutions).toEqual({
      'missingImport': [], // No resolution, should be an empty array
    });
  });
});

