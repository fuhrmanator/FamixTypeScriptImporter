import { Project, SyntaxKind } from 'ts-morph';
import { getFQN } from '../src/fqn';

describe('getFQN functionality', () => {
    let project: Project;
    let sourceFile: ReturnType<Project['createSourceFile']>;

    beforeAll(() => {
        // Step 1: Create a new ts-morph project
        project = new Project(
          {
              compilerOptions: {
                  baseUrl: ""
              },
              useInMemoryFileSystem: true,
          }
      );
      
        // Step 2: Add a source file to the project
        sourceFile = project.createSourceFile('/sampleFile.ts', `
      class MyClass {
        myMethod() {}
      }
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

      export function a(c: MyClass) {
        return () => (c.myMethod());
      }
`);
    });

    test('should generate unique FQN for MyClass', () => {
        // Find the first class declaration in the file
        const classDeclaration = sourceFile.getClassOrThrow('MyClass');

        // Step 3: Test your functionality
        const result = getFQN(classDeclaration);

        // Use Jest's expect function to assert the expected FQN
        // This is a placeholder assertion. Replace 'expectedFQN' with the actual expected FQN string
        expect(result).toBe('{sampleFile.ts}.MyClass[ClassDeclaration]');
    });

    test('should generate unique FQNs for two creations of a class named A within the same source file', () => {
        // Find the class declarations via nodes in the AST
        const classExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.ClassExpression);
        expect(classExpressions.length).toBe(2);
        // find the two classes named A
        const classA1 = classExpressions.find(c => c.getName() === 'A');
        expect(classA1).toBeDefined();
        const classA2 = classExpressions.find(c => c.getName() === 'A' && c !== classA1)!;
        expect(classA2).toBeDefined();
        const a1fqn = getFQN(classA1!);
        expect(a1fqn).toBe('{sampleFile.ts}.createClassA1.ArrowFunction(5:29).Block(5:35).Unnamed_ClassExpression(6:16)[ClassExpression]');
        const a2fqn = getFQN(classA2!);
        expect(a2fqn).toBe('{sampleFile.ts}.createClassA2.ArrowFunction(10:29).Block(10:35).Unnamed_ClassExpression(11:16)[ClassExpression]');
        expect(a1fqn).not.toBe(a2fqn);
    });

    it(`should generate unique FQN for function a`, () => {
        const functionDeclaration = sourceFile.getFunctionOrThrow('a');
        const result = getFQN(functionDeclaration);
        expect(result).toBe('{sampleFile.ts}.a[FunctionDeclaration]');
    });
    
});
