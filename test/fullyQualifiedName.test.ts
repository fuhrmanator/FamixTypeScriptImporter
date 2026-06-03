import { Block, Project, ReturnStatement, SyntaxKind } from 'ts-morph';
import { getFQN } from '../src/fqn';

// TODO: ⏳ Review if the test is still in a sync with a current solution.

const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

describe('fullyQualifiedName functionality', () => {
    let sourceFile: ReturnType<Project['createSourceFile']>;

    beforeAll(() => {

        // Step 2: Add a source file to the project
        sourceFile = project.createSourceFile('/sampleFile.ts', `
            const createClassA1 = () => {
                return class A {
                    method1() {}
                }
            };
            const createClassA2 = () => {
                return class A {
                    method2() {}
                }
            };
            const instance1 = createClassA1();
            const instance2 = createClassA2();
        `);
    });

    test('should generate fully qualified name for createClassA1', () => {
        // Find the variable declaration for createClassA1
        const variableDeclaration = sourceFile.getVariableDeclaration('createClassA1');

        // Step 3: Test your functionality
        const result = getFQN(variableDeclaration!);

        // Use Jest's expect function to assert the expected fully qualified name
        expect(result).toBe('{sampleFile.ts}.createClassA1[VariableDeclaration]');
    });

    test('should generate fully qualified name for method1', () => {
        // Step 1: Access the `createClassA1` Variable Declaration
        const createClassA1Declaration = sourceFile.getVariableDeclaration('createClassA1');
        if (createClassA1Declaration) {
            const arrowFunction = createClassA1Declaration.getInitializerIfKindOrThrow(SyntaxKind.ArrowFunction);
        
            // find the class A that's declared in the body of the arrow function
            const block = arrowFunction.getBody();
            if (!block || block.getKind() !== SyntaxKind.Block) {
                throw new Error('Invalid arrow function body');
            }
            const blockAsBlock = block as Block;
            const returnStatement = blockAsBlock.getStatements().find(s => s.getKind() === SyntaxKind.ReturnStatement);
            if (!returnStatement) {
                throw new Error('Return statement not found');
            }
            const returnStatementAsReturnStatement = returnStatement as ReturnStatement;
            const classDeclaration = returnStatementAsReturnStatement.getExpressionIfKindOrThrow(SyntaxKind.ClassExpression);
            expect(classDeclaration).toBeDefined();
            expect(classDeclaration.getName()).toBe('A');
        
            // Step 2: Access the `method1` Method Declaration
            const methodDeclaration = classDeclaration?.getMethod('method1');
            if (!methodDeclaration) {
                // Handle the undefined case, e.g., throw an error or return
                throw new Error('Method declaration is undefined');
            }
            expect(methodDeclaration).toBeDefined();

            expect(methodDeclaration.getName()).toBe('method1');
            // Step 3: Test your functionality
            const result = getFQN(methodDeclaration);
    
            // Use Jest's expect function to assert the expected fully qualified name
            expect(result).toBe('{sampleFile.ts}.createClassA1.Unnamed_ArrowFunction(2:35).Block(2:41).A.method1[MethodDeclaration]');
        } else {
            throw new Error('Variable declaration is undefined');
        }

    });

    test('should generate fully qualified name for instance1', () => {
        // Find the variable declaration for instance1
        const variableDeclaration = sourceFile.getVariableDeclaration('instance1');

        // Step 3: Test your functionality
        const result = getFQN(variableDeclaration!);

        // Use Jest's expect function to assert the expected fully qualified name
        expect(result).toBe('{sampleFile.ts}.instance1[VariableDeclaration]');
    });
});
