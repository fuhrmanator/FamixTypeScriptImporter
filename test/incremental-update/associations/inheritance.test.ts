import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModel, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

const sourceFileName = 'sourceCode.ts';
const superClassName = 'SuperClass';
const subClassName = 'SubClass';

const superClassCode = `
    class ${superClassName} { }
`;

const subClassWithoutInheritanceCode = `
    class ${subClassName} { }
`;

const subClassWithInheritanceCode = `
    class ${subClassName} extends ${superClassName} { }
`;


const superClassChangedCode = `
    class ${superClassName} {
        // new comment
    }
`;

const sourceCodeWithoutInheritance = `
    ${superClassCode}
    
    ${subClassWithoutInheritanceCode}
  `;

const sourceCodeWithInheritance = `
    ${superClassCode}

    ${subClassWithInheritanceCode}
  `;

const sourceCodeWithInheritanceChanged = `
    ${superClassChangedCode}

    ${subClassWithInheritanceCode}
  `;

describe('Change the inheritance in a single file', () => {

  it('should add new inheritance association', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithoutInheritance);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithInheritance);
      
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithInheritance);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should remove the inheritance association', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithInheritance);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithoutInheritance);
    
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithoutInheritance);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should retain the inheritance association when the superclass is modified', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithInheritance);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithInheritanceChanged);
    
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithInheritanceChanged);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should retain the inheritance association when the superclass is modified 2 times', () => {
    // arrange
    const sourceCodeWithInheritanceChangedTwice = `
        class ${superClassName} {
          // new comment changed
        }
    
        ${subClassWithInheritanceCode}
      `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithInheritance);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithInheritanceChanged);
    
    // act
    let fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithInheritanceChangedTwice);
    fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithInheritanceChangedTwice);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should add new inheritance association between class and interface', () => {
    // arrange    
    const sourceCodeWithInterfaceWithoutInheritance = `
        interface ${superClassName} { }
        interface A { }
        
        class ${subClassName} { }
    `;

    const sourceCodeWithInterfaceInheritance = `
        interface ${superClassName} { }
        interface A { }
        
        class ${subClassName} implements ${superClassName}, A { }
    `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithInterfaceWithoutInheritance);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithInterfaceInheritance);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithInterfaceInheritance);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should add new inheritance association between 2 interfaces', () => {
    // arrange    
    const sourceCodeWithInterfaceWithoutInheritance = `
        interface ${superClassName} { }
        
        interface ${subClassName} { }
    `;

    const sourceCodeWithInterfaceInheritance = `
        interface ${superClassName} { }
        
        interface ${subClassName} extends ${superClassName} { }
    `;

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithInterfaceWithoutInheritance);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithInterfaceInheritance);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithInterfaceInheritance);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});