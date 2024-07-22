import { Project, SyntaxKind } from 'ts-morph';
import { getUniqueFQN } from '../src/fqn';

describe.skip('getUniqueFQN functionality', () => {
    let project: Project;
    let sourceFile: ReturnType<Project['createSourceFile']>;

    beforeAll(() => {
        // Step 1: Create a new ts-morph project
        project = new Project();

        // Step 2: Add a source file to the project
        sourceFile = project.createSourceFile('sampleFile.ts', `
      class MyClass {
        myMethod() {}
      }
    `);
    });

    test('should generate unique FQN for MyClass', () => {
        // Find the first class declaration in the file
        const classDeclaration = sourceFile.getClassOrThrow('MyClass');

        // Step 3: Test your functionality
        const result = getUniqueFQN(classDeclaration);

        // Use Jest's expect function to assert the expected FQN
        // This is a placeholder assertion. Replace 'expectedFQN' with the actual expected FQN string
        expect(result).toBe(':/Users/Cris/Documents/GitHub/FamixTypeScriptImporter/sampleFile.ts::MyClass');
    });

    test('should generate unique FQNs for two instances of class A within the same source file', () => {
        const project = new Project();
        const sourceFile = project.createSourceFile('fqn.test.ts', `
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
        
        // Function to find class expressions within a given variable declaration by name
        function findClassExpressionInVariable(variableName: string) {
          const variableDeclaration = sourceFile.getVariableDeclaration(variableName);
          if (!variableDeclaration) return null;
        
          // Navigate through the AST based on the provided structure
          const arrowFunction = variableDeclaration.getInitializerIfKindOrThrow(SyntaxKind.ArrowFunction);
          const block = arrowFunction.getBody();
          if (!block || block.getKind() !== SyntaxKind.Block) {
            throw new Error('Invalid arrow function body');
          }
          const returnStatement = block.getChildren().find(s => s.getKind() === SyntaxKind.ReturnStatement);
          if (!returnStatement) return null;
        
          const classExpression = returnStatement.getFirstChildByKind(SyntaxKind.ClassExpression);
          return classExpression;
        }
        
        // Use the function to find class expressions for createClassA1 and createClassA2
        const classExpressionA1 = findClassExpressionInVariable('createClassA1');
        const classExpressionA2 = findClassExpressionInVariable('createClassA2');
        
        // Assuming you want to do something with these class expressions, like extracting method names
        const methodNamesA1 = classExpressionA1?.getMembers().filter(m => m.getKind() === SyntaxKind.MethodDeclaration).map(m => m.getName());
        const methodNamesA2 = classExpressionA2?.getMembers().filter(m => m.getKind() === SyntaxKind.MethodDeclaration).map(m => m.getName());
        
        // Assuming getUniqueFQN is a function that can take a class declaration and return a unique FQN
        const fqn1 = methodNamesA1 ? getUniqueFQN(methodNamesA1) : undefined;
        const fqn2 = methodNamesA2 ? getUniqueFQN(methodNamesA2) : undefined;

        // Assert that FQNs are unique
        expect(fqn1).not.toBe(fqn2);
    });

});
