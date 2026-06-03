import { Project, SyntaxKind } from 'ts-morph';
import { getFQN } from '../src/fqn';

// TODO: ⏳ Review if the test is still in a sync with a current solution.

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
      import { rest } from 'msw';

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

    export const handlers = [
        rest.get('/v1/current/standings_all.json', (_req, res, ctx) => {}),
        rest.get('/v2/current/standings_all.json', (_req, res, ctx) => {}),
    ];

    it('bogus call', async () => {
        const resp = 1;
    });

    it('bogus call', async () => {
        const resp = 2;
    });
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
        const classExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.ClassExpression);
        expect(classExpressions.length).toBe(2);
        const classA1 = classExpressions.find(c => c.getName() === 'A');
        expect(classA1).toBeDefined();
        const classA2 = classExpressions.find(c => c.getName() === 'A' && c !== classA1)!;
        expect(classA2).toBeDefined();
        const a1fqn = getFQN(classA1!);
        expect(a1fqn).toBe('{sampleFile.ts}.createClassA1.Unnamed_ArrowFunction(7:29).Block(7:35).A[ClassExpression]');
        const a2fqn = getFQN(classA2!);
        expect(a2fqn).toBe('{sampleFile.ts}.createClassA2.Unnamed_ArrowFunction(12:29).Block(12:35).A[ClassExpression]');
        expect(a1fqn).not.toBe(a2fqn);
    });

    it(`should generate unique FQN for function a`, () => {
        const functionDeclaration = sourceFile.getFunctionOrThrow('a');
        const result = getFQN(functionDeclaration);
        expect(result).toBe('{sampleFile.ts}.a[FunctionDeclaration]');
    });
    
    it(`should generate unique FQN for handlers array`, () => {
        const variableDeclaration = sourceFile.getVariableDeclarationOrThrow('handlers');
        const result = getFQN(variableDeclaration);
        expect(result).toBe('{sampleFile.ts}.handlers[VariableDeclaration]');
    });

    it(`should generate unique FQN for the _req parameter in the arrow function of the FIRST handler`, () => {
        const variableDeclaration = sourceFile.getVariableDeclarationOrThrow('handlers');
        const arrayLiteral = variableDeclaration.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
        const firstElement = arrayLiteral.getElements()[0];

        // Print the kind of the first element to debug
        console.log(firstElement.getKindName());

        // Ensure we are accessing the ArrowFunction correctly
        const arrowFunction = firstElement.asKindOrThrow(SyntaxKind.CallExpression)
            .getArguments()[1].asKindOrThrow(SyntaxKind.ArrowFunction);

        const result = getFQN(arrowFunction.getParameter('_req')!);
        expect(result).toBe('{sampleFile.ts}.handlers.Unnamed_ArrayLiteralExpression(24:29).Unnamed_ArrowFunction(25:52)._req[Parameter]');
    });

    it(`should generate unique FQN for the _req parameter in the arrow function of the SECOND handler`, () => {
        const variableDeclaration = sourceFile.getVariableDeclarationOrThrow('handlers');
        const arrayLiteral = variableDeclaration.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
        const firstElement = arrayLiteral.getElements()[1];

        // Print the kind of the first element to debug
        console.log(firstElement.getKindName());

        // Ensure we are accessing the ArrowFunction correctly
        const arrowFunction = firstElement.asKindOrThrow(SyntaxKind.CallExpression)
            .getArguments()[1].asKindOrThrow(SyntaxKind.ArrowFunction);

        const result = getFQN(arrowFunction.getParameter('_req')!);
        expect(result).toBe('{sampleFile.ts}.handlers.Unnamed_ArrayLiteralExpression(24:29).Unnamed_ArrowFunction(26:52)._req[Parameter]');
    });

    it(`should generate unique FQN for the declaration of the const resp = 1 inside the arrow function on the second parameter of the FIRST call to it()`, () => {
        const firstItCall = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
            .find(call => call.getExpression().getText() === 'it' && call.getArguments().length === 2);
        expect(firstItCall).toBeDefined();

        const arrowFunction = firstItCall!.getArguments()[1].asKindOrThrow(SyntaxKind.ArrowFunction);
        const variableDeclaration = arrowFunction.getVariableDeclarationOrThrow('resp');
        const result = getFQN(variableDeclaration);
        expect(result).toBe('{sampleFile.ts}.Unnamed_ArrowFunction(29:22).Block(29:34).resp[VariableDeclaration]');
    });

    it(`should generate unique FQN for the declaration of the const resp = 2 inside the arrow function on the second parameter of the SECOND call to it()`, () => {
        const secondItCall = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(call => call.getExpression().getText() === 'it' && call.getArguments().length === 2)[1];
        expect(secondItCall).toBeDefined();

        const arrowFunction = secondItCall!.getArguments()[1].asKindOrThrow(SyntaxKind.ArrowFunction);
        const variableDeclaration = arrowFunction.getVariableDeclarationOrThrow('resp');
        const result = getFQN(variableDeclaration);
        expect(result).toBe('{sampleFile.ts}.Unnamed_ArrowFunction(33:22).Block(33:34).resp[VariableDeclaration]');
    });


});
