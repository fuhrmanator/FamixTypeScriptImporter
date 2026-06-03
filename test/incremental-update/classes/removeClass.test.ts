import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModel, getFqnForClass, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

const sourceFileName = 'sourceCode.ts';
const existingClassName1 = 'ExistingClass1';
const existingClassName2 = 'ExistingClass2';

const sourceCodeBefore = `
  class ${existingClassName1} { }

  class ${existingClassName2} { }
`;

const sourceCodeAfterOneClassDeletion = `
  class ${existingClassName1} { }
`;

const sourceCodeAfterAllClassesDeletion = `

`;

describe('Delete classes in a single file', () => {
  it('should remove one class from the Famix representation', async () => {
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeBefore);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeAfterOneClassDeletion);

    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    const existingClass = famixRep._getFamixClass(getFqnForClass(sourceFileName, existingClassName1));
    const deletedClass = famixRep._getFamixClass(getFqnForClass(sourceFileName, existingClassName2));
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeAfterOneClassDeletion);

    expect(existingClass).not.toBeUndefined();
    expect(deletedClass).toBeUndefined();
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should remove all classes from the Famix representation', async () => {
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeBefore);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeAfterAllClassesDeletion);
    
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    const deletedClass1 = famixRep._getFamixClass(getFqnForClass(sourceFileName, existingClassName1));
    const deletedClass2 = famixRep._getFamixClass(getFqnForClass(sourceFileName, existingClassName2));
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeAfterAllClassesDeletion);

    expect(deletedClass1).toBeUndefined();
    expect(deletedClass2).toBeUndefined();
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });
});