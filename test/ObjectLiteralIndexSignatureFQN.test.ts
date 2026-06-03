import { Project, SyntaxKind } from 'ts-morph';
import { getFQN } from '../src/fqn';
import { Importer } from '../src/analyze'; 
import * as Famix from '../src/lib/famix/model/famix'; 

// TODO: ⏳ Review if the test is still in a sync with a current solution.

const project = new Project({
    compilerOptions: {
        baseUrl: ""
    },
    useInMemoryFileSystem: true,
});

describe('Object Literal Index Signature FQN Generation', () => {
    let sourceFile: ReturnType<Project['createSourceFile']>;
    let importer: Importer;
    let fmxRep: any;

    beforeAll(() => {
        sourceFile = project.createSourceFile('/ObjectLiteralIndexSignatureFQN.ts', `
            const key1 = Symbol('key1');
            const key2 = "varString";
            const key3 = 42;
            export const object1 = {
                1: {
                    method1() {},
                    method2() {}
                },
                "keyString": {
                    method3() {},
                    method4() {}
                },
                ["prefix" + "Key"]: {
                    method5() {}
                },
                [key1]: {
                    method6() {}
                },
                [\`template\${7}\`]: {
                    method7() {}
                },
                [key2]: {
                    method8() {}
                },
                [key3]: {
                    method9() {}
                }
            };
        `);

        importer = new Importer();
        fmxRep = importer.famixRepFromProject(project);
    });

    it('should parse the source file and generate Famix representation', () => {
        expect(fmxRep).toBeTruthy();
        expect(sourceFile).toBeTruthy();
    });

    it('should contain the object1 variable with correct FQN', () => {
        const objectDecl = sourceFile.getVariableDeclaration('object1');
        expect(objectDecl).toBeDefined();
        expect(getFQN(objectDecl!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1[VariableDeclaration]');
    });

    it('should generate correct FQN for numeric key methods', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method1 = methods.find(m => m.getName() === 'method1');
        expect(method1).toBeDefined();
        expect(getFQN(method1!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1.1.method1[MethodDeclaration]');

        const method2 = methods.find(m => m.getName() === 'method2');
        expect(method2).toBeDefined();
        expect(getFQN(method2!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1.1.method2[MethodDeclaration]');

        const famixMethod1 = fmxRep._getFamixMethod('{ObjectLiteralIndexSignatureFQN.ts}.object1.1.method1[MethodDeclaration]');
        expect(famixMethod1).toBeTruthy();
        expect(famixMethod1.name).toBe('method1');

        const famixMethod2 = fmxRep._getFamixMethod('{ObjectLiteralIndexSignatureFQN.ts}.object1.1.method2[MethodDeclaration]');
        expect(famixMethod2).toBeTruthy();
        expect(famixMethod2.name).toBe('method2');
    });

    it('should generate correct FQN for string literal key methods', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method3 = methods.find(m => m.getName() === 'method3');
        expect(method3).toBeDefined();
        expect(getFQN(method3!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1.keyString.method3[MethodDeclaration]');

        const method4 = methods.find(m => m.getName() === 'method4');
        expect(method4).toBeDefined();
        expect(getFQN(method4!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1.keyString.method4[MethodDeclaration]');

        const famixMethod3 = fmxRep._getFamixMethod('{ObjectLiteralIndexSignatureFQN.ts}.object1.keyString.method3[MethodDeclaration]');
        expect(famixMethod3).toBeTruthy();
        expect(famixMethod3.name).toBe('method3');

        const famixMethod4 = fmxRep._getFamixMethod('{ObjectLiteralIndexSignatureFQN.ts}.object1.keyString.method4[MethodDeclaration]');
        expect(famixMethod4).toBeTruthy();
        expect(famixMethod4.name).toBe('method4');
    });

    it('should generate correct FQN for computed property (string concat) method', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method5 = methods.find(m => m.getName() === 'method5');
        expect(method5).toBeDefined();
        expect(getFQN(method5!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1.prefixKey.method5[MethodDeclaration]');

        const famixMethod5 = fmxRep._getFamixMethod('{ObjectLiteralIndexSignatureFQN.ts}.object1.prefixKey.method5[MethodDeclaration]');
        expect(famixMethod5).toBeTruthy();
        expect(famixMethod5.name).toBe('method5');
    });

    it('should generate correct FQN for symbol key method', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method6 = methods.find(m => m.getName() === 'method6');
        expect(method6).toBeDefined();
        expect(getFQN(method6!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1.key1.method6[MethodDeclaration]');

        const famixMethod6 = fmxRep._getFamixMethod('{ObjectLiteralIndexSignatureFQN.ts}.object1.key1.method6[MethodDeclaration]');
        expect(famixMethod6).toBeTruthy();
        expect(famixMethod6.name).toBe('method6');
    });

    it('should generate correct FQN for template literal key method', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method7 = methods.find(m => m.getName() === 'method7');
        expect(method7).toBeDefined();
        expect(getFQN(method7!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1.template7.method7[MethodDeclaration]');

        const famixMethod7 = fmxRep._getFamixMethod('{ObjectLiteralIndexSignatureFQN.ts}.object1.template7.method7[MethodDeclaration]');
        expect(famixMethod7).toBeTruthy();
        expect(famixMethod7.name).toBe('method7');
    });

    it('should generate correct FQN for dynamic string variable key method', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method8 = methods.find(m => m.getName() === 'method8');
        expect(method8).toBeDefined();
        expect(getFQN(method8!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1.varString.method8[MethodDeclaration]');

        const famixMethod8 = fmxRep._getFamixMethod('{ObjectLiteralIndexSignatureFQN.ts}.object1.varString.method8[MethodDeclaration]');
        expect(famixMethod8).toBeTruthy();
        expect(famixMethod8.name).toBe('method8');
    });

    it('should generate correct FQN for dynamic numeric variable key method', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method9 = methods.find(m => m.getName() === 'method9');
        expect(method9).toBeDefined();
        expect(getFQN(method9!)).toBe('{ObjectLiteralIndexSignatureFQN.ts}.object1.42.method9[MethodDeclaration]');

        const famixMethod9 = fmxRep._getFamixMethod('{ObjectLiteralIndexSignatureFQN.ts}.object1.42.method9[MethodDeclaration]');
        expect(famixMethod9).toBeTruthy();
        expect(famixMethod9.name).toBe('method9');
    });

    it('should have the correct number of methods in the Famix representation', () => {
        const famixMethods = fmxRep._getAllEntitiesWithType('Method') as Set<Famix.Method>;
        expect(famixMethods.size).toBe(9);
    });
});