import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModel, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

const sourceFileName = 'sourceCode.ts';
const existingClassName = 'ExistingClass';
const newClassName = 'NewClass';

describe('Add new classes to a single file', () => {
  const sourceCodeWithOneClass = `
    class ${existingClassName} { }
  `;

  const sourceCodeWithTwoClasses = `
    class ${existingClassName} { }

    class ${newClassName} { }
  `;

  it('should create new classes in the Famix representation', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithOneClass);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithTwoClasses);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithTwoClasses);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});