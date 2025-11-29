import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModelForSeveralFiles, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

// TODO: 🛠️ Fix code to pass the tests and remove .skip

const exportSourceFileName = 'exportSourceCode.ts';
const importSourceFileName = 'importSourceCode.ts';
const existingClassName = 'ExistingClass';

describe('Change import clause between 2 files', () => {
  const sourceCodeWithExport = `
    export class ${existingClassName} { }
  `;

  const sourceCodeWithExportChanged = `
    class NewBaseClass { }
    export class ${existingClassName} extends NewBaseClass { }
  `;
  
    const sourceCodeWithoutImport = `    
      class NewClass { }
    `;

  const sourceCodeWithImport = `
    import { ${existingClassName} } from './${exportSourceFileName}';

    class NewClass { }
  `;

  const sourceCodeWithImportChanged = `
    import { ${existingClassName} } from './${exportSourceFileName}';

    class NewClassChanged { }
  `;

  it('should add new import clause association', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(importSourceFileName, sourceCodeWithoutImport);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(importSourceFileName, sourceCodeWithImport);
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, sourceCodeWithExport],
        [importSourceFileName, sourceCodeWithImport]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should remove an import clause association', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(importSourceFileName, sourceCodeWithImport);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(importSourceFileName, sourceCodeWithoutImport);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, sourceCodeWithExport],
        [importSourceFileName, sourceCodeWithoutImport]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should retain an import clause association when export file is changed', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(importSourceFileName, sourceCodeWithImport);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, sourceCodeWithExportChanged);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, sourceCodeWithExportChanged],
        [importSourceFileName, sourceCodeWithImport]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should retain an import clause association when importing file is changed', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(importSourceFileName, sourceCodeWithImport);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(importSourceFileName, sourceCodeWithImportChanged);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, sourceCodeWithExport],
        [importSourceFileName, sourceCodeWithImportChanged]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should retain an import clause association and add a stub when export file becomes empty', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(importSourceFileName, sourceCodeWithImport);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, '');

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, ''],
        [importSourceFileName, sourceCodeWithImport]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should retain an import clause association and remove a stub when export file changes from empty', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, '')
        .addSourceFile(importSourceFileName, sourceCodeWithImport);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, sourceCodeWithExport);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, sourceCodeWithExport],
        [importSourceFileName, sourceCodeWithImport]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it.skip('should retain an import clause association and a stub', () => {
    // arrange
    const anotherExportSourceCode = `export class AnotherClass { }`;
    const anotherExportSourceFileName = 'anotherExportSourceCode.ts';
    const sourceCodeWithAnotherImport = `
      import { UndefinedClass } from './${exportSourceFileName}';
      import { AnotherClass } from './${anotherExportSourceFileName}';
    `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(anotherExportSourceFileName, anotherExportSourceCode)
        .addSourceFile(importSourceFileName, sourceCodeWithAnotherImport);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, '');

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, ''],
        [anotherExportSourceFileName, anotherExportSourceCode],
        [importSourceFileName, sourceCodeWithAnotherImport]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it.skip('should retain an import clause association and a stub', () => {
    // arrange
    const anotherExportSourceCode = `export class AnotherClass { }`;
    const anotherExportSourceFileName = 'anotherExportSourceCode.ts';
    const sourceCodeWithAnotherImport = `
      import { UndefinedClass } from './${exportSourceFileName}';
      import { UndefinedClass2 } from './${anotherExportSourceFileName}';
    `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(anotherExportSourceFileName, anotherExportSourceCode)
        .addSourceFile(importSourceFileName, sourceCodeWithAnotherImport);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, '');

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, ''],
        [anotherExportSourceFileName, anotherExportSourceCode],
        [importSourceFileName, sourceCodeWithAnotherImport]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should not duplicate class methids when the exporting file changed several times', () => {
    // arrange
    const exportingSourceCode = `export class B { }`;
    const importingSourceCode = `
      import { B } from './${exportSourceFileName}';

      class A { 
        constructor() {}
      }`;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(exportSourceFileName, exportingSourceCode);
    testProjectBuilder.addSourceFile(importSourceFileName, importingSourceCode);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, exportingSourceCode);
    
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);
    importer.updateFamixModelIncrementally(fileChangesMap);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, exportingSourceCode],
        [importSourceFileName, importingSourceCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});
