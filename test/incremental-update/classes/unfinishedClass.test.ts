import { skip } from "node:test";
import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModel, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

// TODO: 🛠️ Improve broken code handling to pass the tests and remove .skip

const sourceFileName = 'sourceCode.ts';
const existingClassName = 'ExistingClass';
const superClassName = 'SuperClass';
const subClassName = 'SubClass';

const superClassCode = `
    class ${superClassName} {
        protected property1: string;
        protected method1() {}
    }
`;

const subClassWithInheritanceCode = `
    class ${subClassName} extends ${superClassName} {
        method2(): number {
            return 42;
        }
    }
`;

const sourceCodeWithInheritance = `
    ${superClassCode}

    ${subClassWithInheritanceCode}
  `;

describe('Modify classes with errors in a single file ', () => {
  const sourceCodeBefore = `
    class ${existingClassName} {
      property1: string;
      method1() {}
    }
  `;

  it('should create a class when the bracket is missed', () => {
    // arrange
    const sourceCodeAfter = `
        class ${existingClassName} 
            property1: string;
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
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeAfter);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  skip('should retain the inheritance association when the superclass property is broken', () => {
    // arrange
    const sourceCodeWithBrokenInheritance = `
        class ${superClassName} {
            protected property1string;
            protected method1() {}
        }
    
        ${subClassWithInheritanceCode}
    `; // the bracket is missed in the superclass
    
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithInheritance);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithBrokenInheritance);
    
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithBrokenInheritance);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  skip('should retain the inheritance association when the extend clause is broken', () => {
    // arrange
    const sourceCodeWithBrokenInheritance = `
        ${superClassCode}
    
        class ${subClassName} extends${superClassName} {
            method2(): number {
                return 42;
            }
        }
    `; // the bracket is missed in the superclass

    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithInheritance);
    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithBrokenInheritance);
    
    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithBrokenInheritance);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle when superclass is renamed but subclass still extends the old name', () => {
    // arrange
    const renamedSuperClassName = 'RenamedExistingClass';
    const sourceCodeWithRenamedSuperclass = `
        class ${renamedSuperClassName} {
            protected property1: string;
            protected method1() {}
        }
    
        class ${subClassName} extends ${superClassName} {
            method2(): number {
                return 42;
            }
        }
    `;
    
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithInheritance);
    const { importer } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithRenamedSuperclass);
    
    // act & assert
    expect(() => {
      const fileChangesMap = getUpdateFileChangesMap(sourceFile);
      importer.updateFamixModelIncrementally(fileChangesMap);
    }).toThrow(`Symbol not found for ${superClassName}.`);
  });
});