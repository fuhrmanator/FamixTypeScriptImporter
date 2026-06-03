import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModel, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

const sourceFileName = 'sourceCode.ts';
const className = 'MyClass';
const propertyName = 'myProperty';
const newPropertyName = 'myRenamedProperty';

describe('Change property name in a class in a single file', () => {
  const sourceCodeWithProperty = `
    class ${className} {
      ${propertyName}: number;
    }
  `;

  const sourceCodeWithRenamedProperty = `
    class ${className} {
      ${newPropertyName}: number;
    }
  `;

  const sourceCodeWithNewPropertyType = `
    class ${className} {
      ${propertyName}: string;
    }
  `;

  const sourceCodeWithNewPropertyAccessLevel = `
    class ${className} {
      public ${propertyName}: number;
    }
  `;

  const sourceCodeWithNewPropertyStaticModifier = `
    class ${className} {
      static ${propertyName}: number;
    }
  `;

  const sourceCodeWithNewPropertyReadonlyModifier = `
    class ${className} {
      readonly ${propertyName}: number;
    }
  `;

    const sourceCodeWithParameterProperty = `
		class ${className} {
            constructor(
                private ${propertyName}: number
            ) { }
		}
    `;

  it('should update the property name in the Famix representation', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithProperty);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithRenamedProperty);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithRenamedProperty);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should update the property type in the Famix representation', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithProperty);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithNewPropertyType);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithNewPropertyType);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should update the property access level in the Famix representation', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithProperty);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithNewPropertyAccessLevel);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithNewPropertyAccessLevel);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should update the property static modifier in the Famix representation', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithProperty);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithNewPropertyStaticModifier);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithNewPropertyStaticModifier);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should update the property readonly modifier in the Famix representation', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithProperty);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithNewPropertyReadonlyModifier);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithNewPropertyReadonlyModifier);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should retain the property in the Famix representation when changed to parameter property', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithProperty);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithParameterProperty);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithParameterProperty);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});

describe('Change property name in a interface in a single file', () => {
  const sourceCodeWithProperty = `
    interface ${className} {
      ${propertyName}: number;
    }
  `;

  const sourceCodeWithRenamedProperty = `
    interface ${className} {
      ${newPropertyName}: number;
    }
  `;

  it('should update the property name in the Famix representation', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithProperty);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithRenamedProperty);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithRenamedProperty);
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});