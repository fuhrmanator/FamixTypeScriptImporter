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

describe('Method Signature FQN Generation with Return Type', () => {
    let sourceFile: ReturnType<Project['createSourceFile']>;
    let importer: Importer;
    let fmxRep: any;

    beforeAll(() => {
        sourceFile = project.createSourceFile('/SourceFile1.ts', `
            interface GenericType<T> {}
            interface Interface1 {
                method1<TInput = any, TOutput = TInput>(
                    param1: GenericType<TInput> | Function | string | symbol
                ): TOutput;
                method1<TInput = any, TOutput = TInput>(
                    param1: GenericType<TInput> | Function | string | symbol,
                    param2: { strict?: boolean; each?: undefined | false }
                ): TOutput;
                method1<TInput = any, TOutput = TInput>(
                    param1: GenericType<TInput> | Function | string | symbol,
                    param2: { strict?: boolean; each: true }
                ): Array<TOutput>;
            }
        `);

        importer = new Importer();
        fmxRep = importer.famixRepFromProject(project);
    });

    it('should parse the source file and generate Famix representation', () => {
        expect(fmxRep).toBeTruthy();
        expect(sourceFile).toBeTruthy();
    });

    it('should contain the Interface1 interface with correct FQN', () => {
        const interfaceDecl = sourceFile.getInterface('Interface1');
        expect(interfaceDecl).toBeDefined();
        expect(getFQN(interfaceDecl!)).toBe('{SourceFile1.ts}.Interface1[InterfaceDeclaration]');
    });

    it('should generate correct FQN for first method1 signature', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodSignature);
        const method1 = methods[0];
        expect(method1).toBeDefined();
        expect(getFQN(method1!)).toBe('{SourceFile1.ts}.Interface1.method1(string|symbol|Function|GenericType<TInput>):TOutput[MethodSignature]');

        const famixMethod1 = fmxRep._getFamixMethod('{SourceFile1.ts}.Interface1.method1(string|symbol|Function|GenericType<TInput>):TOutput[MethodSignature]');
        expect(famixMethod1).toBeTruthy();
        expect(famixMethod1.name).toBe('method1');
    });

    it('should generate correct FQN for first method1 return type', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodSignature);
        const method1 = methods[0];
        expect(method1).toBeDefined();
        
        const returnTypeFQN = '{SourceFile1.ts}.Interface1.method1(string|symbol|Function|GenericType<TInput>):TOutput[ReturnType]';
        const famixReturnType = fmxRep.getFamixEntityByFullyQualifiedName(returnTypeFQN);
        expect(famixReturnType).toBeTruthy();
        expect(famixReturnType.name).toBe('TOutput');
    });

    it('should generate correct FQN for second method1 signature', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodSignature);
        const method2 = methods[1];
        expect(method2).toBeDefined();
        expect(getFQN(method2!)).toBe('{SourceFile1.ts}.Interface1.2.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each?:false;}):TOutput[MethodSignature]');

        const famixMethod2 = fmxRep._getFamixMethod('{SourceFile1.ts}.Interface1.2.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each?:false;}):TOutput[MethodSignature]');
        expect(famixMethod2).toBeTruthy();
        expect(famixMethod2.name).toBe('method1');
    });

    it('should generate correct FQN for second method1 return type', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodSignature);
        const method2 = methods[1];
        expect(method2).toBeDefined();
        
        const returnTypeFQN = '{SourceFile1.ts}.Interface1.2.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each?:false;}):TOutput[ReturnType]';
        const famixReturnType = fmxRep.getFamixEntityByFullyQualifiedName(returnTypeFQN);
        expect(famixReturnType).toBeTruthy();
        expect(famixReturnType.name).toBe('TOutput');
    });

    it('should generate correct FQN for third method1 signature', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodSignature);
        const method3 = methods[2];
        expect(method3).toBeDefined();
        expect(getFQN(method3!)).toBe('{SourceFile1.ts}.Interface1.3.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each:true;}):TOutput[][MethodSignature]');

        const famixMethod3 = fmxRep._getFamixMethod('{SourceFile1.ts}.Interface1.3.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each:true;}):TOutput[][MethodSignature]');
        expect(famixMethod3).toBeTruthy();
        expect(famixMethod3.name).toBe('method1');
    });

    it('should generate correct FQN for third method1 return type', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodSignature);
        const method3 = methods[2];
        expect(method3).toBeDefined();
        
        const returnTypeFQN = '{SourceFile1.ts}.Interface1.3.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each:true;}):TOutput[][ReturnType]';
        const famixReturnType = fmxRep.getFamixEntityByFullyQualifiedName(returnTypeFQN);
        expect(famixReturnType).toBeTruthy();
        expect(famixReturnType.name).toBe('TOutput[]');
    });

    it('should generate correct FQN for method parameters', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodSignature);
        
        // First method parameters
        const method1 = methods[0];
        const param1 = method1.getParameters()[0];
        expect(param1).toBeDefined();
        expect(getFQN(param1!)).toBe('{SourceFile1.ts}.Interface1.method1(string|symbol|Function|GenericType<TInput>):TOutput.param1[Parameter]');

        // Second method parameters
        const method2 = methods[1];
        const param2_1 = method2.getParameters()[0];
        const param2_2 = method2.getParameters()[1];
        expect(param2_1).toBeDefined();
        expect(param2_2).toBeDefined();
        expect(getFQN(param2_1!)).toBe('{SourceFile1.ts}.Interface1.2.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each?:false;}):TOutput.param1[Parameter]');
        expect(getFQN(param2_2!)).toBe('{SourceFile1.ts}.Interface1.2.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each?:false;}):TOutput.param2[Parameter]');

        // Third method parameters
        const method3 = methods[2];
        const param3_1 = method3.getParameters()[0];
        const param3_2 = method3.getParameters()[1];
        expect(param3_1).toBeDefined();
        expect(param3_2).toBeDefined();
        expect(getFQN(param3_1!)).toBe('{SourceFile1.ts}.Interface1.3.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each:true;}):TOutput[].param1[Parameter]');
        expect(getFQN(param3_2!)).toBe('{SourceFile1.ts}.Interface1.3.method1(string|symbol|Function|GenericType<TInput>,{strict?:boolean;each:true;}):TOutput[].param2[Parameter]');
    });
});