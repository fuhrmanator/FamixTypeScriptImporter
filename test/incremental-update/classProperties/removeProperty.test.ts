import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModel, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

const sourceFileName = 'sourceCode.ts';
const className = 'MyClass';
const propertyName = 'myProperty';

describe('Remove property from a class in a single file', () => {
  const sourceCodeWithProperty = `
    class ${className} {
      ${propertyName}: number;
    }
  `;

    const sourceCodeWithParameterProperty = `
		class ${className} {
            constructor(
                public ${propertyName}: number
            ) { }
		}
    `;

  const sourceCodeWithoutProperty = `
    class ${className} { }
  `;

  it('should remove the property from the Famix representation', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithProperty);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithoutProperty);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithoutProperty);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  test.skip('should remove the parameter property from the Famix representation', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithParameterProperty);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithoutProperty);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithoutProperty);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});
