import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModelForSeveralFiles, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

// TODO: 🛠️ Implement feature to pass the tests and remove .skip

const exportSourceFileName = 'exportSourceCode.ts';
const importSourceFileName = 'importSourceCode.ts';
const existingClassName = 'ExistingClass';

describe.skip('Import clause equals declaration tests', () => {
  const sourceCodeWithExport = `
    export default class ${existingClassName} { }
  `;

  const sourceCodeWithExportChanged = `
    export default class ${existingClassName} { 
      newMethod() { }
    }
  `;
  
  const sourceCodeWithoutImport = `    
    class NewClass { }
  `;

  const sourceCodeWithImportEquals = `
    import ${existingClassName} = require('./${exportSourceFileName}');

    class NewClass { }
  `;

  const sourceCodeWithImportEqualsChanged = `
    import ${existingClassName} = require('./${exportSourceFileName}');

    class NewClassChanged { }
  `;

  it('should add new import equals declaration association', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(importSourceFileName, sourceCodeWithoutImport);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(importSourceFileName, sourceCodeWithImportEquals);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, sourceCodeWithExport],
        [importSourceFileName, sourceCodeWithImportEquals]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should remove an import equals declaration association', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(importSourceFileName, sourceCodeWithImportEquals);

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

  it('should retain an import equals declaration association when export file is changed', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(importSourceFileName, sourceCodeWithImportEquals);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, sourceCodeWithExportChanged);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, sourceCodeWithExportChanged],
        [importSourceFileName, sourceCodeWithImportEquals]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should retain an import equals declaration association when importing file is changed', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, sourceCodeWithExport)
        .addSourceFile(importSourceFileName, sourceCodeWithImportEquals);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(importSourceFileName, sourceCodeWithImportEqualsChanged);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, sourceCodeWithExport],
        [importSourceFileName, sourceCodeWithImportEqualsChanged]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});