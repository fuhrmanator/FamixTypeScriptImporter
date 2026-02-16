import { Project, SyntaxKind, Node } from 'ts-morph';
import { getFQN } from '../src/fqn';
import { Importer } from '../src/analyze';
import * as Famix from '../src/lib/famix/model/famix';

const project = new Project({
    compilerOptions: {
        baseUrl: "",
        strict: false,
        skipLibCheck: true,
    },
    useInMemoryFileSystem: true,
});

describe('FunctionExpression and ArrowFunction FQN Generation', () => {
    let sourceFile: ReturnType<Project['createSourceFile']>;
    let importer: Importer;
    let fmxRep: any;

    beforeAll(() => {
        sourceFile = project.createSourceFile('/pve-stages.ts', `
            const logData = (x: any) => { return x; };

            module Foo {
                const func1 = (d: number) => logData(d);
                const func3 = (d: number) => logData(d * 3);
            }

            class number1 {
                get() {
                    const arr = [1, 2, 3];

                    arr.forEach(d => logData(d));
                    arr.forEach(d => logData(d * 2));

                    arr.forEach(function(d) {
                        logData(d);
                    });

                    arr.forEach(function(d) {
                        logData(d * 2);
                    });

                    function namedFunc() {}
                }
            }
        `);

        importer = new Importer();
        fmxRep = importer.famixRepFromProject(project);
        console.log('All Famix Entities:', Array.from(fmxRep._getAllEntities()).map((e: any) => ({
            fqn: e.fullyQualifiedName,
            name: e.name,
            type: e.constructor.name
        })));
        console.log('Famix ArrowFunctions:', Array.from(fmxRep._getAllEntitiesWithType('ArrowFunction')).map((a: any) => ({
            fqn: a.fullyQualifiedName,
            name: a.name,
            type: a.constructor.name
        })));
        console.log('Famix Functions:', Array.from(fmxRep._getAllEntitiesWithType('Function')).map((f: any) => ({
            fqn: f.fullyQualifiedName,
            name: f.name,
            type: f.constructor.name
        })));
    });

    it('should parse the source file and generate Famix representation', () => {
        expect(fmxRep).toBeTruthy();
        expect(sourceFile).toBeTruthy();
    });

    it('should generate unique FQNs for top-level duplicate ArrowFunction (Foo module)', () => {
        const variableDecls = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
        const func1 = variableDecls.find(v => v.getName() === 'func1');
        const func3 = variableDecls.find(v => v.getName() === 'func3');
        expect(func1).toBeDefined();
        expect(func3).toBeDefined();

        // ArrowFunction in func1
        const arrow1 = func1!.getInitializerIfKindOrThrow(SyntaxKind.ArrowFunction);
        expect(Node.isArrowFunction(arrow1)).toBe(true);
        expect(getFQN(arrow1)).toBe('{pve-stages.ts}.Foo.func1.Unnamed_ArrowFunction(5:31)[ArrowFunction]');

        // ArrowFunction in func3
        const arrow2 = func3!.getInitializerIfKindOrThrow(SyntaxKind.ArrowFunction);
        expect(Node.isArrowFunction(arrow2)).toBe(true);
        expect(getFQN(arrow2)).toBe('{pve-stages.ts}.Foo.func3.Unnamed_ArrowFunction(6:31)[ArrowFunction]');

        // Famix checks
        const famixArrowFunctions = fmxRep._getAllEntitiesWithType('ArrowFunction') as Set<Famix.ArrowFunction>;
        const famixArrow1 = Array.from(famixArrowFunctions).find(a => a.fullyQualifiedName === '{pve-stages.ts}.Foo.func1.Unnamed_ArrowFunction(5:31)[ArrowFunction]');
        expect(famixArrow1).toBeTruthy();
        expect(famixArrow1?.name).toBe('func1');

        const famixArrow2 = Array.from(famixArrowFunctions).find(a => a.fullyQualifiedName === '{pve-stages.ts}.Foo.func3.Unnamed_ArrowFunction(6:31)[ArrowFunction]');
        expect(famixArrow2).toBeTruthy();
        expect(famixArrow2?.name).toBe('func3');
    });

    it('should generate unique FQNs for duplicate ArrowFunction and FunctionExpression in number1.get (arr.forEach)', () => {
        const method = sourceFile.getClass('number1')?.getMethod('get');
        expect(method).toBeDefined();

        const forEachCalls = method!.getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(c => c.getExpression().getText() === 'arr.forEach');
        expect(forEachCalls.length).toBe(4);

        // ArrowFunction in first arr.forEach
        const arrow1 = forEachCalls[0].getArguments()[0];
        expect(Node.isArrowFunction(arrow1)).toBe(true);
        expect(getFQN(arrow1)).toBe('{pve-stages.ts}.number1.get.Block(10:23).Unnamed_ArrowFunction(13:33)[ArrowFunction]');

        // ArrowFunction in second arr.forEach
        const arrow2 = forEachCalls[1].getArguments()[0];
        expect(Node.isArrowFunction(arrow2)).toBe(true);
        expect(getFQN(arrow2)).toBe('{pve-stages.ts}.number1.get.Block(10:23).Unnamed_ArrowFunction(14:33)[ArrowFunction]');

        // FunctionExpression in third arr.forEach
        const func1 = forEachCalls[2].getArguments()[0];
        expect(Node.isFunctionExpression(func1)).toBe(true);
        expect(getFQN(func1)).toBe('{pve-stages.ts}.number1.get.Block(10:23).3.undefined[FunctionExpression]');

        // FunctionExpression in fourth arr.forEach
        const func2 = forEachCalls[3].getArguments()[0];
        expect(Node.isFunctionExpression(func2)).toBe(true);
        expect(getFQN(func2)).toBe('{pve-stages.ts}.number1.get.Block(10:23).4.undefined[FunctionExpression]');

        // Famix checks
        const famixArrowFunctions = fmxRep._getAllEntitiesWithType('ArrowFunction') as Set<Famix.ArrowFunction>;
        const famixArrow1 = Array.from(famixArrowFunctions).find(a => a.fullyQualifiedName === '{pve-stages.ts}.number1.get.Block(10:23).Unnamed_ArrowFunction(13:33)[ArrowFunction]');
        console.log('famixArrow1:', famixArrow1 ? { fqn: famixArrow1.fullyQualifiedName, name: famixArrow1.name, type: famixArrow1.constructor.name } : 'undefined');
        expect(famixArrow1).toBeTruthy();
        expect(famixArrow1?.name).toBe('(NO_NAME)');

        const famixArrow2 = Array.from(famixArrowFunctions).find(a => a.fullyQualifiedName === '{pve-stages.ts}.number1.get.Block(10:23).Unnamed_ArrowFunction(13:33)[ArrowFunction]');
        console.log('famixArrow2:', famixArrow2 ? { fqn: famixArrow2.fullyQualifiedName, name: famixArrow2.name, type: famixArrow2.constructor.name } : 'undefined');
        expect(famixArrow2).toBeTruthy();
        expect(famixArrow2?.name).toBe('(NO_NAME)');

        const famixFunctions = fmxRep._getAllEntitiesWithType('Function') as Set<Famix.Function>;
        const famixFunc1 = Array.from(famixFunctions).find(f => f.fullyQualifiedName === '{pve-stages.ts}.number1.get.Block(10:23).3.undefined[FunctionExpression]');
        expect(famixFunc1).toBeTruthy();
        expect(famixFunc1?.name).toBe('anonymous');

        const famixFunc2 = Array.from(famixFunctions).find(f => f.fullyQualifiedName === '{pve-stages.ts}.number1.get.Block(10:23).4.undefined[FunctionExpression]');
        expect(famixFunc2).toBeTruthy();
        expect(famixFunc2?.name).toBe('anonymous');

        // Check namedFunc
        const namedFunc = method!.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)
            .find(f => f.getName() === 'namedFunc');
        expect(namedFunc).toBeDefined();
        expect(getFQN(namedFunc!)).toBe('{pve-stages.ts}.number1.get.Block(10:23).namedFunc[FunctionDeclaration]');
        const famixNamedFunc = Array.from(famixFunctions).find(f => f.fullyQualifiedName === '{pve-stages.ts}.number1.get.Block(10:23).namedFunc[FunctionDeclaration]');
        expect(famixNamedFunc).toBeTruthy();
        expect(famixNamedFunc?.name).toBe('namedFunc');
    });
});