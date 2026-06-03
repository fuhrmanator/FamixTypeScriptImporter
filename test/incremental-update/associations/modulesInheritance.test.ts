import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModelForSeveralFiles, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

const sourceFileNameUsesSuper = 'sourceCodeUsesSuper.ts';
const superClassName = 'SuperClass';
const subClassName = 'SubClass';
const sourceFileNameSuperClass = `${superClassName}.ts`;
const sourceFileNameSubClass = `${subClassName}.ts`;

const exportSuperClassCode = `
    export class ${superClassName} { }
`;

const subClassWithoutInheritanceCode = `
    class ${subClassName} { }
`;

const importSubClassWithInheritanceCode = `
    import { ${superClassName} } from './${superClassName}';
    class ${subClassName} extends ${superClassName} { }
`;

const exportSuperClassChangedCode = `
    class BaseSuperClass { }
    export class ${superClassName} extends BaseSuperClass { }
`;

const fileCodeThatUsesSuperClass = `
    import { ${superClassName} } from './${superClassName}';
    
    const instance = new ${superClassName}();
`;

describe('Change the inheritance between several files', () => {
  it('should add new inheritance association', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(sourceFileNameSuperClass, exportSuperClassCode)
      .addSourceFile(sourceFileNameSubClass, subClassWithoutInheritanceCode);
    const { importer, famixRep } = testProjectBuilder.build();

    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileNameSubClass, importSubClassWithInheritanceCode);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [sourceFileNameSuperClass, exportSuperClassCode],
        [sourceFileNameSubClass, importSubClassWithInheritanceCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should remove the inheritance association', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(sourceFileNameSuperClass, exportSuperClassCode)
      .addSourceFile(sourceFileNameSubClass, importSubClassWithInheritanceCode);
      const { importer, famixRep } = testProjectBuilder.build();

    const sourceFile = testProjectBuilder.changeSourceFile(sourceFileNameSubClass, subClassWithoutInheritanceCode);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [sourceFileNameSuperClass, exportSuperClassCode],
        [sourceFileNameSubClass, subClassWithoutInheritanceCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should retain the inheritance association when the superclass is modified', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(sourceFileNameSubClass, importSubClassWithInheritanceCode)
      .addSourceFile(sourceFileNameSuperClass, exportSuperClassCode);

    const { importer, famixRep } = testProjectBuilder.build();
    const sourceFile = testProjectBuilder
      .changeSourceFile(sourceFileNameSuperClass, exportSuperClassChangedCode);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [sourceFileNameSuperClass, exportSuperClassChangedCode],
        [sourceFileNameSubClass, importSubClassWithInheritanceCode]
    ]);

    // it seems that the issue is connected with the createOrGetFamixInterfaceStub
    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle 3-file project with inheritance when superclass changes', () => {
    // arrange
    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(sourceFileNameSuperClass, exportSuperClassCode)
      .addSourceFile(sourceFileNameSubClass, importSubClassWithInheritanceCode)
      .addSourceFile(sourceFileNameUsesSuper, fileCodeThatUsesSuperClass);
      const { importer, famixRep } = testProjectBuilder.build();

    const sourceFile = testProjectBuilder
      .changeSourceFile(sourceFileNameSuperClass, exportSuperClassChangedCode);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [sourceFileNameSuperClass, exportSuperClassChangedCode],
        [sourceFileNameSubClass, importSubClassWithInheritanceCode],
        [sourceFileNameUsesSuper, fileCodeThatUsesSuperClass]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle a chain of the classes with inheritance when super class changed', () => {
    // arrange
    const classACode = `export class classA { }`;
    const classACodeChanged = `
    import { SomeUndefinedClass } from './unexistingModule.ts';
    export class classA extends SomeUndefinedClass { }`;
    const classAFileName = 'classA.ts';

    const classBCode = `import { classA } from './classA';
    export class classB extends classA { }`;
    const classBFileName = 'classB.ts';

    const classCCode = `import { classB } from './classB';
    export class classC extends classB { }`;
    const classCFileName = 'classC.ts';


    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(classAFileName, classACode)
      .addSourceFile(classBFileName, classBCode)
      .addSourceFile(classCFileName, classCCode);
    const { importer, famixRep } = testProjectBuilder.build();

    const sourceFile = testProjectBuilder
      .changeSourceFile(classAFileName, classACodeChanged);

    // act
    const fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [classAFileName, classACodeChanged],
        [classBFileName, classBCode],
        [classCFileName, classCCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle a chain of the classes with inheritance when super class changed 2 times', () => {
    // arrange
    const classACode = `export class classA { }`;
    const classACodeChanged = `
    import { SomeUndefinedClass } from './unexistingModule.ts';
    export class classA extends SomeUndefinedClass { }`;
    const classACodeChangedTwice = `
    import { OtherUndefinedClass } from './unexistingModule.ts';
    export class classA extends OtherUndefinedClass { }`;
    const classAFileName = 'classA.ts';

    const classBCode = `import { classA } from './classA';
    export class classB extends classA { }`;
    const classBFileName = 'classB.ts';

    const classCCode = `import { classB } from './classB';
    export class classC extends classB { }`;
    const classCFileName = 'classC.ts';


    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(classAFileName, classACode)
      .addSourceFile(classBFileName, classBCode)
      .addSourceFile(classCFileName, classCCode);
    const { importer, famixRep } = testProjectBuilder.build();

    let sourceFile = testProjectBuilder
      .changeSourceFile(classAFileName, classACodeChanged);

    // act
    let fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);
    
    sourceFile = testProjectBuilder.changeSourceFile(classAFileName, classACodeChangedTwice);
    
    fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [classAFileName, classACodeChangedTwice],
        [classBFileName, classBCode],
        [classCFileName, classCCode]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });

  it('should handle a chain of the interfaces with inheritance when super class changed 2 times', () => {
    // arrange
    const codeA = `export interface A { }`;
    const codeAChanged = `
    import { SomeUndefined } from './unexistingModule.ts';
    export interface A extends SomeUndefined { }`;
    const codeAChangedTwice = `
    import { OtherUndefined } from './unexistingModule.ts';
    export interface A extends OtherUndefined { }`;
    const codeAFileName = 'codeA.ts';

    const codeB = `import { A } from './codeA';
    export interface B extends A { }`;
    const codeBFileName = 'codeB.ts';

    const codeC = `import { B } from './codeB';
    export interface C extends B { }`;
    const codeCFileName = 'codeC.ts';


    const testProjectBuilder = new IncrementalUpdateProjectBuilder();
    testProjectBuilder
      .addSourceFile(codeAFileName, codeA)
      .addSourceFile(codeBFileName, codeB)
      .addSourceFile(codeCFileName, codeC);
    const { importer, famixRep } = testProjectBuilder.build();

    let sourceFile = testProjectBuilder
      .changeSourceFile(codeAFileName, codeAChanged);

    // act
    let fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);
    
    sourceFile = testProjectBuilder.changeSourceFile(codeAFileName, codeAChangedTwice);
    
    fileChangesMap = getUpdateFileChangesMap(sourceFile);
    importer.updateFamixModelIncrementally(fileChangesMap);

    // assert
    const expectedFamixRepo = createExpectedFamixModelForSeveralFiles([
        [codeAFileName, codeAChangedTwice],
        [codeBFileName, codeB],
        [codeCFileName, codeC]
    ]);

    expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
  });
});