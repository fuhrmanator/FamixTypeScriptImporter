import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModel, getFqnForClass, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

const sourceFileName = 'sourceCode.ts';
const existingClassName = 'ExistingClass';

const sourceCodeBefore = `
  class ${existingClassName} { }
`;

describe('Modify classes in a single file', () => {
  it('should add new method into the Famix class', () => {
    // arrange
    const sourceCodeAfter = `
        class ${existingClassName} {
            method1() {}
        }
    `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeBefore);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeAfter);
        
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const existingClass = famixRep._getFamixClass(getFqnForClass(sourceFileName, existingClassName));

    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeAfter);

    expect(existingClass).not.toBeUndefined();
    expect(existingClass!.methods.size).toEqual(1);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should add new property into the Famix class', () => {
    // arrange
    const sourceCodeAfter = `
        class ${existingClassName} {
            property1: string;
        }
    `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeBefore);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeAfter);
    
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const existingClass = famixRep._getFamixClass(getFqnForClass(sourceFileName, existingClassName));

    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeAfter);

    expect(existingClass).not.toBeUndefined();
    expect(existingClass!.properties.size).toEqual(1);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should rename the Famix class', () => {
    // arrange
    const newClassName = 'RenamedExistingClass';
    const sourceCodeAfter = `
        class ${newClassName} { }
    `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeBefore);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeAfter);
     
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const oldClass = famixRep._getFamixClass(getFqnForClass(sourceFileName, existingClassName));
    const renamedClass = famixRep._getFamixClass(getFqnForClass(sourceFileName, newClassName));

    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeAfter);

    expect(oldClass).toBeUndefined();
    expect(renamedClass).not.toBeUndefined();
    expect(renamedClass!.name).toEqual(newClassName);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});