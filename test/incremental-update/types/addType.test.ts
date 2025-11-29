import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModel, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

// TODO: 🛠️ Fix code to pass the tests and remove .skip
// TODO: add separate files with tests for removing and changing types

describe.skip('Add existing entities as types to properties in a single file', () => {
    const sourceFileName = 'sourceCode.ts';

    const arrangeAndActAddTypes = (sourceCodeWithNoType: string, sourceCodeWithType: string) => {
        // arrange
        const testProjectBuilder = new IncrementalUpdateProjectBuilder();
        testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithNoType);
        const { importer, famixRep } = testProjectBuilder.build();
        const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithType);

        // act
        const fileChangesMap = getUpdateFileChangesMap(sourceFile);
        importer.updateFamixModelIncrementally(fileChangesMap);
        const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithType);

        return { famixRep, expectedFamixRepo };
    };

    it('should create a property with class type', () => {
        const sourceCodeWithNoType = `
            class ClassForType { }
            class MyClass { }
        `;

        const sourceCodeWithType = `
            class ClassForType { }
            class MyClass {
                myProperty: ClassForType;
            }
        `;

        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(sourceCodeWithNoType, sourceCodeWithType);
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });

    it('should create a property with interface type', () => {
        const sourceCodeWithNoType = `
            interface ClassForType { }
            class MyClass { }
        `;

        const sourceCodeWithType = `
            interface ClassForType { }
            class MyClass {
                myProperty: ClassForType;
            }
        `;

        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(sourceCodeWithNoType, sourceCodeWithType);
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });

    it('should create a property with array type', () => {
        const sourceCodeWithNoType = `
            class MyClass { }
        `;

        const sourceCodeWithType = `
            class MyClass {
                myProperty: number[];
            }
        `;

        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(sourceCodeWithNoType, sourceCodeWithType);
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });

    it('should create a property with enum type', () => {
        const sourceCodeWithNoType = `
            enum UEQ { }
            class MyClass { }
        `;

        const sourceCodeWithType = `
            enum UEQ { }
            class MyClass {
                myProperty: UEQ;
            }
        `;
  
        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(sourceCodeWithNoType, sourceCodeWithType);
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });

    it('should create a property with tuple', () => {
        const sourceCodeWithNoType = `
            class MyClass { }
        `;

        const sourceCodeWithType = `
            class MyClass {
                myProperty: [string, number];
            }
        `;

        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(sourceCodeWithNoType, sourceCodeWithType);
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });

    it('should create a property with aliased type', () => {
        const sourceCodeWithNoType = `
            type ClassForType = string;
            class MyClass { }
        `;

        const sourceCodeWithType = `
            type ClassForType = string;
            class MyClass {
                myProperty: ClassForType;
            }
        `;

        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(sourceCodeWithNoType, sourceCodeWithType);
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });

    it('should create variables with primitive types', () => {
        const sourceCodeWithNoType = ``;

        const sourceCodeWithType = `
            const aString: string = "one";
            const aBoolean: boolean = false;
            const aNumber: number = 3;
            const aNull: null = null;
            const anUnknown: unknown = 5;
            const anAny: any = 6;
            declare const aUniqueSymbol: unique symbol = Symbol("seven");
            let aNever: never; // note that const eight: never cannot happen as we cannot instantiate a never
            // See Theo Despoudis. TypeScript 4 Design Patterns and Best Practices (Kindle Locations 514-520). Packt Publishing Pvt Ltd.
            const aBigint: bigint = 9n;
            const aVoid: void = undefined;
            const aSymbol: symbol = Symbol("ten");
            const anUndefined: undefined = undefined;
        `;

        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(sourceCodeWithNoType, sourceCodeWithType);
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });
});

describe.skip('Add existing entities as types to properties between multiple files', () => {
    const exportingFileName = 'exportingFile.ts';
    const importingFileName = 'importingFile.ts';

    const importingFileCodeWithoutProperty = `
        import { ClassForType } from "./exportingFile";
        class MyClass { }
    `;

    const importingFileCodeWithProperty = `
        import { ClassForType } from "./exportingFile";
        class MyClass {
            myProperty: ClassForType;
        }
    `;

    const arrangeAndActAddTypes = (exportingFileCode: string) => {
        // arrange
        const testProjectBuilder = new IncrementalUpdateProjectBuilder();
        testProjectBuilder.addSourceFile(exportingFileName, exportingFileCode);
        testProjectBuilder.addSourceFile(importingFileName, importingFileCodeWithoutProperty);
        const { importer, famixRep } = testProjectBuilder.build();
        const sourceFile = testProjectBuilder.changeSourceFile(importingFileName, importingFileCodeWithProperty);

        // act
        const fileChangesMap = getUpdateFileChangesMap(sourceFile);
        importer.updateFamixModelIncrementally(fileChangesMap);

        const expectedFamixRepo = createExpectedFamixModel(importingFileName, importingFileCodeWithProperty);

        return { famixRep, expectedFamixRepo };
    };

    it('should create a property with class type', () => {
        const exportingFileCode = 'export class ClassForType { }';

        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(exportingFileCode);
        // assert
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });

    it('should create a property with interface type', () => {
        const exportingFileCode = 'export interface ClassForType { }';

        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(exportingFileCode);
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });

    it('should create a property with type', () => {
        const exportingFileCode = 'export type ClassForType = { };';

        const {famixRep, expectedFamixRepo} = arrangeAndActAddTypes(exportingFileCode);
        expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
    });
});