import { Project, SyntaxKind } from 'ts-morph';
import { getFQN } from '../src/fqn';
import { Importer } from '../src/analyze';
import * as Famix from '../src/lib/famix/model/famix';

const project = new Project({
    compilerOptions: {
        baseUrl: ""
    },
    useInMemoryFileSystem: true,
});

describe('Method Overload and Parameter FQN Generation', () => {
    let sourceFile: ReturnType<Project['createSourceFile']>;
    let importer: Importer;
    let fmxRep: any;

    beforeAll(() => {
        sourceFile = project.createSourceFile('/MethodOverloadFQN.ts', `
            declare namespace ns1 {
                class Calculator {
                    static add(x: string): number;
                    static add(x: number): number;
                    static add(x: any): number;
                }
                interface ICalculator {
                    subtract(value: string): number;
                    subtract(value: number): number;
                }
            }
            declare namespace ns2 {
                class Processor {
                    static process(data: boolean): void;
                    static process(data: null): void;
                }
            }
            declare namespace monaco {
                interface UriComponents {
                    scheme: string;
                    authority: string;
                }
                class Uri {
                    static revive(data: UriComponents | Uri): Uri;
                    static revive(data: UriComponents | Uri | undefined): Uri | undefined;
                    static revive(data: UriComponents | Uri | null): Uri | null;
                    static revive(data: UriComponents | Uri | undefined | null): Uri | undefined | null;
                }
            }
        `);

        importer = new Importer();
        fmxRep = importer.famixRepFromProject(project);
    });

    it('should parse the source file and generate Famix representation', () => {
        expect(fmxRep).toBeTruthy();
        expect(sourceFile).toBeTruthy();
    });

    it('should generate correct FQNs for class methods in namespace ns1.Calculator', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const add1 = methods.find(m => m.getName() === 'add' && m.getParameters()[0]?.getType().getText() === 'string');
        expect(add1).toBeDefined();
        expect(getFQN(add1!)).toBe('{MethodOverloadFQN.ts}.ns1.Calculator.add[MethodDeclaration]');

        const add2 = methods.find(m => m.getName() === 'add' && m.getParameters()[0]?.getType().getText() === 'number');
        expect(add2).toBeDefined();
        expect(getFQN(add2!)).toBe('{MethodOverloadFQN.ts}.ns1.Calculator.2.add[MethodDeclaration]');

        const add3 = methods.find(m => m.getName() === 'add' && m.getParameters()[0]?.getType().getText() === 'any');
        expect(add3).toBeDefined();
        expect(getFQN(add3!)).toBe('{MethodOverloadFQN.ts}.ns1.Calculator.3.add[MethodDeclaration]');

        const famixAdd1 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.ns1.Calculator.add[MethodDeclaration]');
        expect(famixAdd1).toBeTruthy();
        expect(famixAdd1.name).toBe('add');

        const famixAdd2 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.ns1.Calculator.2.add[MethodDeclaration]');
        expect(famixAdd2).toBeTruthy();
        expect(famixAdd2.name).toBe('add');

        const famixAdd3 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.ns1.Calculator.3.add[MethodDeclaration]');
        expect(famixAdd3).toBeTruthy();
        expect(famixAdd3.name).toBe('add');
    });

    it('should generate correct FQNs for interface methods in namespace ns1.ICalculator', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodSignature);
        const subtract1 = methods.find(m => m.getName() === 'subtract' && m.getParameters()[0]?.getType().getText() === 'string');
        expect(subtract1).toBeDefined();
        expect(getFQN(subtract1!)).toBe('{MethodOverloadFQN.ts}.ns1.ICalculator.subtract(string):number[MethodSignature]');

        const subtract2 = methods.find(m => m.getName() === 'subtract' && m.getParameters()[0]?.getType().getText() === 'number');
        expect(subtract2).toBeDefined();
        expect(getFQN(subtract2!)).toBe('{MethodOverloadFQN.ts}.ns1.ICalculator.2.subtract(number):number[MethodSignature]');

        const famixSubtract1 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.ns1.ICalculator.subtract(string):number[MethodSignature]');
        expect(famixSubtract1).toBeTruthy();
        expect(famixSubtract1.name).toBe('subtract');

        const famixSubtract2 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.ns1.ICalculator.2.subtract(number):number[MethodSignature]');
        expect(famixSubtract2).toBeTruthy();
        expect(famixSubtract2.name).toBe('subtract');
    });

    it('should generate correct FQNs for parameters in ns1.Calculator.add', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const x1 = parameters.find(p => p.getName() === 'x' && p.getType().getText() === 'string');
        expect(x1).toBeDefined();
        expect(getFQN(x1!)).toBe('{MethodOverloadFQN.ts}.ns1.Calculator.add.x[Parameter]');

        const x2 = parameters.find(p => p.getName() === 'x' && p.getType().getText() === 'number');
        expect(x2).toBeDefined();
        expect(getFQN(x2!)).toBe('{MethodOverloadFQN.ts}.ns1.Calculator.2.add.x[Parameter]');

        const x3 = parameters.find(p => p.getName() === 'x' && p.getType().getText() === 'any');
        expect(x3).toBeDefined();
        expect(getFQN(x3!)).toBe('{MethodOverloadFQN.ts}.ns1.Calculator.3.add.x[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.ns1.Calculator.add.x[Parameter]');
        expect(famixParam1).toBeTruthy();
        expect(famixParam1).toBeDefined();
        expect(famixParam1!.name).toBe('x');

        const famixParam2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.ns1.Calculator.2.add.x[Parameter]');
        expect(famixParam2).toBeTruthy();
        expect(famixParam2).toBeDefined();
        if (famixParam2) {
            expect(famixParam2.name).toBe('x');
        }

        const famixParam3 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.ns1.Calculator.3.add.x[Parameter]');
        expect(famixParam3).toBeTruthy();
        if (famixParam3) {
            expect(famixParam3.name).toBe('x');
        }
    });

    it('should generate correct FQNs for parameters in ns1.ICalculator.subtract', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const value1 = parameters.find(p => p.getName() === 'value' && p.getType().getText() === 'string');
        expect(value1).toBeDefined();
        expect(getFQN(value1!)).toBe('{MethodOverloadFQN.ts}.ns1.ICalculator.subtract(string):number.value[Parameter]');

        const value2 = parameters.find(p => p.getName() === 'value' && p.getType().getText() === 'number');
        expect(value2).toBeDefined();
        expect(getFQN(value2!)).toBe('{MethodOverloadFQN.ts}.ns1.ICalculator.2.subtract(number):number.value[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.ns1.ICalculator.subtract(string):number.value[Parameter]');
        expect(famixParam1).toBeTruthy();
        expect(famixParam1).toBeDefined();
        if (famixParam1) {
            expect(famixParam1.name).toBe('value');
        }

        const famixParam2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.ns1.ICalculator.2.subtract(number):number.value[Parameter]');
        expect(famixParam2).toBeTruthy();
        if (famixParam2) {
            expect(famixParam2.name).toBe('value');
        }
    });
    it('should generate correct FQNs for class methods in namespace ns2.Processor', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const process1 = methods.find(m => m.getName() === 'process' && m.getParameters()[0]?.getType().getText() === 'boolean');
        expect(process1).toBeDefined();
        expect(getFQN(process1!)).toBe('{MethodOverloadFQN.ts}.ns2.Processor.process[MethodDeclaration]');

        const process2 = methods.find(m => m.getName() === 'process' && m.getParameters()[0]?.getType().getText() === 'null');
        expect(process2).toBeDefined();
        expect(getFQN(process2!)).toBe('{MethodOverloadFQN.ts}.ns2.Processor.2.process[MethodDeclaration]');

        const famixProcess1 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.ns2.Processor.process[MethodDeclaration]');
        expect(famixProcess1).toBeTruthy();
        expect(famixProcess1.name).toBe('process');

        const famixProcess2 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.ns2.Processor.2.process[MethodDeclaration]');
        expect(famixProcess2).toBeTruthy();
        expect(famixProcess2.name).toBe('process');
    });

    it('should generate correct FQNs for parameters in ns2.Processor.process', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const data1 = parameters.find(p => p.getName() === 'data' && p.getType().getText() === 'boolean');
        expect(data1).toBeDefined();
        expect(getFQN(data1!)).toBe('{MethodOverloadFQN.ts}.ns2.Processor.process.data[Parameter]');

        const data2 = parameters.find(p => p.getName() === 'data' && p.getType().getText() === 'null');
        expect(data2).toBeDefined();
        expect(getFQN(data2!)).toBe('{MethodOverloadFQN.ts}.ns2.Processor.2.process.data[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.ns2.Processor.process.data[Parameter]');
        expect(famixParam1).toBeTruthy();
        expect(famixParam1?.name).toBe('data');

        const famixParam2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.ns2.Processor.2.process.data[Parameter]');
        expect(famixParam2).toBeTruthy();
        if (famixParam2) {
            expect(famixParam2.name).toBe('data');
        }
    });

    it('should generate correct FQNs for parameters in ns2.Processor.process', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const data1 = parameters.find(p => p.getName() === 'data' && p.getType().getText() === 'boolean');
        expect(data1).toBeDefined();
        expect(getFQN(data1!)).toBe('{MethodOverloadFQN.ts}.ns2.Processor.process.data[Parameter]');

        const data2 = parameters.find(p => p.getName() === 'data' && p.getType().getText() === 'null');
        expect(data2).toBeDefined();
        expect(getFQN(data2!)).toBe('{MethodOverloadFQN.ts}.ns2.Processor.2.process.data[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.ns2.Processor.process.data[Parameter]');
        expect(famixParam1).toBeTruthy();
        expect(famixParam1?.name).toBe('data');

        const famixParam2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.ns2.Processor.2.process.data[Parameter]');
        expect(famixParam2).toBeTruthy();
        expect(famixParam2?.name).toBe('data');
    });

    it('should generate correct FQNs for class methods in namespace monaco.Uri', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const revive1 = methods.find(m => m.getName() === 'revive' && m.getText().includes('data: UriComponents | Uri): Uri'));
        expect(revive1).toBeDefined();
        expect(getFQN(revive1!)).toBe('{MethodOverloadFQN.ts}.monaco.Uri.revive[MethodDeclaration]');

        const revive2 = methods.find(m => m.getName() === 'revive' && m.getText().includes('data: UriComponents | Uri | undefined): Uri | undefined'));
        expect(revive2).toBeDefined();
        expect(getFQN(revive2!)).toBe('{MethodOverloadFQN.ts}.monaco.Uri.2.revive[MethodDeclaration]');

        const revive3 = methods.find(m => m.getName() === 'revive' && m.getText().includes('data: UriComponents | Uri | null): Uri | null'));
        expect(revive3).toBeDefined();
        expect(getFQN(revive3!)).toBe('{MethodOverloadFQN.ts}.monaco.Uri.3.revive[MethodDeclaration]');

        const revive4 = methods.find(m => m.getName() === 'revive' && m.getText().includes('data: UriComponents | Uri | undefined | null): Uri | undefined | null'));
        expect(revive4).toBeDefined();
        expect(getFQN(revive4!)).toBe('{MethodOverloadFQN.ts}.monaco.Uri.4.revive[MethodDeclaration]');

        const famixRevive1 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.monaco.Uri.revive[MethodDeclaration]');
        expect(famixRevive1).toBeTruthy();
        expect(famixRevive1.name).toBe('revive');

        const famixRevive2 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.monaco.Uri.2.revive[MethodDeclaration]');
        expect(famixRevive2).toBeTruthy();
        expect(famixRevive2.name).toBe('revive');

        const famixRevive3 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.monaco.Uri.3.revive[MethodDeclaration]');
        expect(famixRevive3).toBeTruthy();
        expect(famixRevive3.name).toBe('revive');

        const famixRevive4 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.monaco.Uri.4.revive[MethodDeclaration]');
        expect(famixRevive4).toBeTruthy();
        expect(famixRevive4.name).toBe('revive');
    });

    it('should generate correct FQNs for parameters in monaco.Uri.revive', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const data1 = parameters.find(p => p.getName() === 'data' && p.getParent().getText().includes('data: UriComponents | Uri): Uri'));
        expect(data1).toBeDefined();
        expect(getFQN(data1!)).toBe('{MethodOverloadFQN.ts}.monaco.Uri.revive.data[Parameter]');

        const data2 = parameters.find(p => p.getName() === 'data' && p.getParent().getText().includes('data: UriComponents | Uri | undefined): Uri | undefined'));
        expect(data2).toBeDefined();
        expect(getFQN(data2!)).toBe('{MethodOverloadFQN.ts}.monaco.Uri.2.revive.data[Parameter]');

        const data3 = parameters.find(p => p.getName() === 'data' && p.getParent().getText().includes('data: UriComponents | Uri | null): Uri | null'));
        expect(data3).toBeDefined();
        expect(getFQN(data3!)).toBe('{MethodOverloadFQN.ts}.monaco.Uri.3.revive.data[Parameter]');

        const data4 = parameters.find(p => p.getName() === 'data' && p.getParent().getText().includes('data: UriComponents | Uri | undefined | null): Uri | undefined | null'));
        expect(data4).toBeDefined();
        expect(getFQN(data4!)).toBe('{MethodOverloadFQN.ts}.monaco.Uri.4.revive.data[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.monaco.Uri.revive.data[Parameter]');
        expect(famixParam1).toBeTruthy();
        expect(famixParam1?.name).toBe('data');

        const famixParam2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.monaco.Uri.2.revive.data[Parameter]');
        expect(famixParam2).toBeTruthy();
        expect(famixParam2?.name).toBe('data');

        const famixParam3 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.monaco.Uri.3.revive.data[Parameter]');
        expect(famixParam3).toBeTruthy();
        expect(famixParam3?.name).toBe('data');

        const famixParam4 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.monaco.Uri.4.revive.data[Parameter]');
        expect(famixParam4).toBeTruthy();
        expect(famixParam4?.name).toBe('data');
    });
    
});