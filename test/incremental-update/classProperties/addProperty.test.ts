
import { expectRepositoriesToHaveSameStructure } from "../incrementalUpdateExpect";
import { IncrementalUpdateProjectBuilder } from "../incrementalUpdateProjectBuilder";
import { createExpectedFamixModel, getUpdateFileChangesMap } from "../incrementalUpdateTestHelper";

const sourceFileName = 'sourceCode.ts';
const className = 'MyClass';
const propertyName = 'myProperty';

describe('Add new properties to a class in a single file', () => {
	const sourceCodeWithNoProperty = `
		class ${className} { }
	`;

	const sourceCodeWithProperty = `
		class ${className} {
			${propertyName}: number;
		}
	`;

    // https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties
    const sourceCodeWithParameterProperty = `
		class ${className} {
            constructor(
                public readonly x: number,
                protected y: number,
                private z: number
            ) { }
		}
    `;

	it('should create new properties in the Famix representation', () => {
		// arrange
		const testProjectBuilder = new IncrementalUpdateProjectBuilder();
		testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithNoProperty);
		const { importer, famixRep } = testProjectBuilder.build();
		const sourceFile = testProjectBuilder.changeSourceFile(sourceFileName, sourceCodeWithProperty);

		// act
		const fileChangesMap = getUpdateFileChangesMap(sourceFile);
		importer.updateFamixModelIncrementally(fileChangesMap);

		// assert
		const expectedFamixRepo = createExpectedFamixModel(sourceFileName, sourceCodeWithProperty);
		expectRepositoriesToHaveSameStructure(famixRep, expectedFamixRepo);
	});

	it('should create new properties in the Famix representation for a class with parameter properties', () => {
		// arrange
		const testProjectBuilder = new IncrementalUpdateProjectBuilder();
		testProjectBuilder.addSourceFile(sourceFileName, sourceCodeWithNoProperty);
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
