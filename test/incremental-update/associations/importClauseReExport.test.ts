import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModelForSeveralFiles, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

describe('Named import re-export functionality with inheritance changes', () => {
  const exportSourceFileName = 'exportSource.ts';
  const reexportSourceFileName = 'reexportSource.ts';
  const importSourceFileName = 'importSource.ts';
  const existingClassName = 'ExistingClass';
  
  const initialExportCode = `
    export class ${existingClassName} { }
  `;

  const exportCodeWithInheritance = `
    class BaseClass { }
    
    export class ${existingClassName} extends BaseClass { }
  `;

  const reexportCode = `
    export { ${existingClassName} } from './${exportSourceFileName}';
  `;

  const importCode = `
    import { ${existingClassName} } from './${reexportSourceFileName}';

    class ConsumerClass extends ${existingClassName} { }
  `;

  it('should maintain re-export associations when original export adds inheritance', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, initialExportCode)
        .addSourceFile(reexportSourceFileName, reexportCode)
        .addSourceFile(importSourceFileName, importCode);

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - change the original export file to add inheritance
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, exportCodeWithInheritance);
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, exportCodeWithInheritance],
        [reexportSourceFileName, reexportCode],
        [importSourceFileName, importCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should establish correct re-export chain from scratch', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, initialExportCode)
        .addSourceFile(reexportSourceFileName, '')
        .addSourceFile(importSourceFileName, '');

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - add re-export
    let sourceFile = testProjectBuilder.changeSourceFile(reexportSourceFileName, reexportCode);
    let fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // act - add import from re-export
    sourceFile = testProjectBuilder.changeSourceFile(importSourceFileName, importCode);
    fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, initialExportCode],
        [reexportSourceFileName, reexportCode],
        [importSourceFileName, importCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle removing re-export while maintaining original export', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, initialExportCode)
        .addSourceFile(reexportSourceFileName, reexportCode)
        .addSourceFile(importSourceFileName, importCode);

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - remove re-export
    const sourceFile = testProjectBuilder.changeSourceFile(reexportSourceFileName, '');
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
      [exportSourceFileName, initialExportCode],
      [reexportSourceFileName, ''],
      [importSourceFileName, importCode]
    ]);
    
    // assert
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should update re-export associations when import file changes to use original export', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, initialExportCode)
        .addSourceFile(reexportSourceFileName, reexportCode)
        .addSourceFile(importSourceFileName, importCode);

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - change import to use original export instead of re-export
    const directImportCode = `
      import { ${existingClassName} } from './${exportSourceFileName}';

      class ConsumerClass {
        private instance: ${existingClassName};

        constructor() {
          this.instance = new ${existingClassName}();
        }
      }
    `;
    
    const sourceFile = testProjectBuilder.changeSourceFile(importSourceFileName, directImportCode);
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, initialExportCode],
        [reexportSourceFileName, reexportCode],
        [importSourceFileName, directImportCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});

describe('5-file named import re-export chain test', () => {
  const originalExportFileName = 'originalExport.ts';
  const reexport1FileName = 'reexport1.ts';
  const reexport2FileName = 'reexport2.ts';
  const reexport3FileName = 'reexport3.ts';
  const finalImportFileName = 'finalImport.ts';
  
  const originalExportCode = `
    export interface Interface1 {}
  `;

  const reexport1Code = `
    export { Interface1 } from './${originalExportFileName}';
  `;

  const reexport2Code = `
    export { Interface1 } from './${reexport1FileName}';
  `;

  const reexport3Code = `
    export { Interface1 } from './${reexport2FileName}';
  `;

  const finalImportCode = `
    import { Interface1 } from './${reexport3FileName}';

    class Consumer implements Interface1 { }
  `;
  it('should handle changes in the middle of a 5-file re-export chain', () => {

    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(originalExportFileName, originalExportCode)
      .addSourceFile(reexport1FileName, reexport1Code)
      .addSourceFile(reexport2FileName, reexport2Code)
      .addSourceFile(reexport3FileName, reexport3Code)
      .addSourceFile(finalImportFileName, finalImportCode);

    const { importer, famixRep } = testProjectBuilder.build();

    // act - modify the middle file to add an additional class export
    const sourceFile = testProjectBuilder.changeSourceFile(reexport1FileName, '');
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
      [originalExportFileName, originalExportCode],
      [reexport1FileName, ''],
      [reexport2FileName, reexport2Code],
      [reexport3FileName, reexport3Code],
      [finalImportFileName, finalImportCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle changes in the middle of a 5-file re-export chain', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(originalExportFileName, originalExportCode)
      .addSourceFile(reexport1FileName, '')
      .addSourceFile(reexport2FileName, reexport2Code)
      .addSourceFile(reexport3FileName, reexport3Code)
      .addSourceFile(finalImportFileName, finalImportCode);

    const { importer, famixRep } = testProjectBuilder.build();

    // act - modify the middle file to add an additional class export
    const sourceFile = testProjectBuilder.changeSourceFile(reexport1FileName, reexport1Code);
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
      [originalExportFileName, originalExportCode],
      [reexport1FileName, reexport1Code],
      [reexport2FileName, reexport2Code],
      [reexport3FileName, reexport3Code],
      [finalImportFileName, finalImportCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});

describe('Default named import re-export functionality', () => {
  const sourceFileName = 'source.ts';
  const reexportFileName = 'reexport.ts';
  const importFileName = 'import.ts';

  it('should handle default re-export with alias: export { default as DefaultExport } from "bar.js"', () => {
    // arrange
    const sourceCode = `
      export default class DefaultClass { }
    `;

    const reexportCode = `
      export { default as DefaultExport } from './${sourceFileName}';
    `;

    const importCode = `
      import { DefaultExport } from './${reexportFileName}';
    `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(sourceFileName, sourceCode)
        .addSourceFile(reexportFileName, reexportCode)
        .addSourceFile(importFileName, importCode);

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - modify the source to add a property
    const modifiedSourceCode = `
      class BaseClass { }
      export default class DefaultClass extends BaseClass { }
    `;
    
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, modifiedSourceCode);
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [sourceFileName, modifiedSourceCode],
        [reexportFileName, reexportCode],
        [importFileName, importCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });


  it('should handle chained default re-exports with aliases', () => {
    // arrange
    const originalFileName = 'original.ts';
    const reexport1FileName = 'reexport1.ts';
    const reexport2FileName = 'reexport2.ts';
    const finalImportFileName = 'finalImport.ts';

    const originalCode = `
      export default interface OriginalInterface { }
    `;

    const reexport1Code = `
      export { default as AliasedInterface } from './${originalFileName}';
    `;

    const reexport2Code = `
      export { AliasedInterface as FinalInterface } from './${reexport1FileName}';
    `;

    const finalImportCode = `
      import { FinalInterface } from './${reexport2FileName}';

      class Implementation implements FinalInterface { }
    `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(originalFileName, originalCode)
        .addSourceFile(reexport1FileName, reexport1Code)
        .addSourceFile(reexport2FileName, reexport2Code)
        .addSourceFile(finalImportFileName, finalImportCode);

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - modify the original interface to add a property
    const modifiedOriginalCode = `
      interface BaseInterface { }
      export default interface OriginalInterface extends BaseInterface { }
    `;
    
    const sourceFile = testProjectBuilder.changeSourceFile(originalFileName, modifiedOriginalCode);
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [originalFileName, modifiedOriginalCode],
        [reexport1FileName, reexport1Code],
        [reexport2FileName, reexport2Code],
        [finalImportFileName, finalImportCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});

describe('Namespace import re-export with inheritance changes', () => {
  const exportSourceFileName = 'exportSource.ts';
  const reexportSourceFileName = 'reexportSource.ts';
  const importSourceFileName = 'importSource.ts';
  const existingClassName = 'ExistingClass';
  
  const initialExportCode = `
    export class ${existingClassName} { }
  `;

  const exportCodeWithInheritance = `
    class BaseClass { }
    
    export class ${existingClassName} extends BaseClass { }
  `;

  const reexportCode = `
    export * from './${exportSourceFileName}';
  `;

  const importCode = `
    import * as base from './${reexportSourceFileName}';

    class ConsumerClass extends base.${existingClassName} { }
  `;

  it('should maintain re-export associations when original export adds inheritance', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, initialExportCode)
        .addSourceFile(reexportSourceFileName, reexportCode)
        .addSourceFile(importSourceFileName, importCode);

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - change the original export file to add inheritance
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, exportCodeWithInheritance);
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, exportCodeWithInheritance],
        [reexportSourceFileName, reexportCode],
        [importSourceFileName, importCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should establish correct re-export chain from scratch', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, initialExportCode)
        .addSourceFile(reexportSourceFileName, '')
        .addSourceFile(importSourceFileName, '');

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - add re-export
    let sourceFile = testProjectBuilder.changeSourceFile(reexportSourceFileName, reexportCode);
    let fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // act - add import from re-export
    sourceFile = testProjectBuilder.changeSourceFile(importSourceFileName, importCode);
    fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, initialExportCode],
        [reexportSourceFileName, reexportCode],
        [importSourceFileName, importCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle removing re-export while maintaining original export', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, initialExportCode)
        .addSourceFile(reexportSourceFileName, reexportCode)
        .addSourceFile(importSourceFileName, importCode);

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - remove re-export
    const sourceFile = testProjectBuilder.changeSourceFile(reexportSourceFileName, '');
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
      [exportSourceFileName, initialExportCode],
      [reexportSourceFileName, ''],
      [importSourceFileName, importCode]
    ]);
    
    // assert
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should update re-export associations when import file changes to use original export', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, initialExportCode)
        .addSourceFile(reexportSourceFileName, reexportCode)
        .addSourceFile(importSourceFileName, importCode);

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - change import to use original export instead of re-export
    const directImportCode = `
      import { ${existingClassName} } from './${exportSourceFileName}';

      class ConsumerClass {
        private instance: ${existingClassName};

        constructor() {
          this.instance = new ${existingClassName}();
        }
      }
    `;
    
    const sourceFile = testProjectBuilder.changeSourceFile(importSourceFileName, directImportCode);
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [exportSourceFileName, initialExportCode],
        [reexportSourceFileName, reexportCode],
        [importSourceFileName, directImportCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle removing original export', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
        .addSourceFile(exportSourceFileName, initialExportCode)
        .addSourceFile(reexportSourceFileName, reexportCode)
        .addSourceFile(importSourceFileName, importCode);

    const { importer, famixRep } = testProjectBuilder.build();
    
    // act - remove re-export
    const sourceFile = testProjectBuilder.changeSourceFile(exportSourceFileName, '');
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
      [exportSourceFileName, ''],
      [reexportSourceFileName, reexportCode],
      [importSourceFileName, importCode]
    ]);
    
    // assert
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});

describe('5-file namespace import re-export chain test', () => {
  const originalExportFileName = 'originalExport.ts';
  const reexport1FileName = 'reexport1.ts';
  const reexport2FileName = 'reexport2.ts';
  const reexport3FileName = 'reexport3.ts';
  const finalImportFileName = 'finalImport.ts';
  
  const originalExportCode = `
    export interface Interface1 {}
  `;

  const reexport1Code = `
    export * from './${originalExportFileName}';
  `;

  const reexport2Code = `
    export * from './${reexport1FileName}';
  `;

  const reexport3Code = `
    export * from './${reexport2FileName}';
  `;

  const finalImportCode = `
    import * as x from './${reexport3FileName}';

    class Consumer implements x.Interface1 { }
  `;
  it('should handle changes in the middle of a 5-file re-export chain', () => {

    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(originalExportFileName, originalExportCode)
      .addSourceFile(reexport1FileName, reexport1Code)
      .addSourceFile(reexport2FileName, reexport2Code)
      .addSourceFile(reexport3FileName, reexport3Code)
      .addSourceFile(finalImportFileName, finalImportCode);

    const { importer, famixRep } = testProjectBuilder.build();

    // act - modify the middle file to add an additional class export
    const sourceFile = testProjectBuilder.changeSourceFile(reexport1FileName, '');
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
      [originalExportFileName, originalExportCode],
      [reexport1FileName, ''],
      [reexport2FileName, reexport2Code],
      [reexport3FileName, reexport3Code],
      [finalImportFileName, finalImportCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle changes in the middle of a 5-file re-export chain', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(originalExportFileName, originalExportCode)
      .addSourceFile(reexport1FileName, '')
      .addSourceFile(reexport2FileName, reexport2Code)
      .addSourceFile(reexport3FileName, reexport3Code)
      .addSourceFile(finalImportFileName, finalImportCode);

    const { importer, famixRep } = testProjectBuilder.build();

    // act - modify the middle file to add an additional class export
    const sourceFile = testProjectBuilder.changeSourceFile(reexport1FileName, reexport1Code);
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
      [originalExportFileName, originalExportCode],
      [reexport1FileName, reexport1Code],
      [reexport2FileName, reexport2Code],
      [reexport3FileName, reexport3Code],
      [finalImportFileName, finalImportCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});