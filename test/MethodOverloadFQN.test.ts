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

describe('Method, Function Overload, and Class Property FQN Generation', () => {
    let sourceFile: ReturnType<Project['createSourceFile']>;
    let importer: Importer;
    let fmxRep: any;

    beforeAll(() => {
        sourceFile = project.createSourceFile('/MethodOverloadFQN.ts', `
            declare namespace Namespace2 {
                class Class1 {
                    static prop1: string | number;
                    prop2: boolean;
                    static method1(param1: string): number;
                    static method1(param1: number): number;
                    static method1(param1: any): number;
                }
                interface Interface1 {
                    method2(param2: string): number;
                    method2(param2: number): number;
                }
            }
            declare namespace Namespace3 {
                class Class2 {
                    prop3: any;
                    static method3(param3: boolean): void;
                    static method3(param3: null): void;
                }
            }
            declare namespace Namespace4 {
                interface Interface2 {
                    prop1: string;
                    prop2: string;
                }
                class Class3 {
                    prop4: Interface2 | null;
                    prop5: Class3;
                    static method4(param3: Interface2 | Class3): Class3;
                    static method4(param3: Interface2 | Class3 | undefined): Class3 | undefined;
                    static method4(param3: Interface2 | Class3 | null): Class3 | null;
                    static method4(param3: Interface2 | Class3 | undefined | null): Class3 | undefined | null;
                }
            }
            declare namespace Namespace1 {
                module Module1 {
                    export function function1(param4: Interface3): Interface5<Interface4>;
                    export function function1(param4: Interface3, param6?: Interface6): Interface5<Interface4>;
                    export function function1(param5: Interface7, param6?: Interface6): Interface5<Interface4>;
               

 }
            }
            interface Interface3 {}
            interface Interface4 {}
            interface Interface5<T> {}
            interface Interface6 {}
            interface Interface7 {}
        `);

        importer = new Importer();
        fmxRep = importer.famixRepFromProject(project);
        // Debug: Log all Property entities
        console.log('Famix Properties:', Array.from(fmxRep._getAllEntitiesWithType('Property')).map(p => (p as Famix.Property).fullyQualifiedName));
    });

    it('should parse the source file and generate Famix representation', () => {
        expect(fmxRep).toBeTruthy();
        expect(sourceFile).toBeTruthy();
    });

    it('should generate correct FQNs for class properties in Namespace2.Class1', () => {
        const properties = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyDeclaration);

        const prop1 = properties.find(p => p.getName() === 'prop1');
        expect(prop1).toBeDefined();
        expect(getFQN(prop1!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Class1.prop1[PropertyDeclaration]');

        const prop2 = properties.find(p => p.getName() === 'prop2');
        expect(prop2).toBeDefined();
        expect(getFQN(prop2!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Class1.prop2[PropertyDeclaration]');

        const famixProperties = fmxRep._getAllEntitiesWithType('Property') as Set<Famix.Property>;
        const famixProp1 = Array.from(famixProperties).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace2.Class1.prop1[PropertyDeclaration]');
        expect(famixProp1).toBeTruthy();
        expect(famixProp1?.name).toBe('prop1');

        const famixProp2 = Array.from(famixProperties).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace2.Class1.prop2[PropertyDeclaration]');
        expect(famixProp2).toBeTruthy();
        expect(famixProp2?.name).toBe('prop2');
    });

    it('should generate correct FQNs for class properties in Namespace3.Class2', () => {
        const properties = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyDeclaration);

        const prop3 = properties.find(p => p.getName() === 'prop3');
        expect(prop3).toBeDefined();
        expect(getFQN(prop3!)).toBe('{MethodOverloadFQN.ts}.Namespace3.Class2.prop3[PropertyDeclaration]');

        const famixProperties = fmxRep._getAllEntitiesWithType('Property') as Set<Famix.Property>;
        const famixProp3 = Array.from(famixProperties).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace3.Class2.prop3[PropertyDeclaration]');
        expect(famixProp3).toBeTruthy();
        expect(famixProp3?.name).toBe('prop3');
    });

    it('should generate correct FQNs for class properties in Namespace4.Class3', () => {
        const properties = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyDeclaration);

        const prop4 = properties.find(p => p.getName() === 'prop4');
        expect(prop4).toBeDefined();
        expect(getFQN(prop4!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.prop4[PropertyDeclaration]');

        const prop5 = properties.find(p => p.getName() === 'prop5');
        expect(prop5).toBeDefined();
        expect(getFQN(prop5!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.prop5[PropertyDeclaration]');

        const famixProperties = fmxRep._getAllEntitiesWithType('Property') as Set<Famix.Property>;
        const famixProp4 = Array.from(famixProperties).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace4.Class3.prop4[PropertyDeclaration]');
        expect(famixProp4).toBeTruthy();
        expect(famixProp4?.name).toBe('prop4');

        const famixProp5 = Array.from(famixProperties).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace4.Class3.prop5[PropertyDeclaration]');
        expect(famixProp5).toBeTruthy();
        expect(famixProp5?.name).toBe('prop5');
    });

    it('should generate correct FQNs for class methods in namespace Namespace2.Class1', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method1_1 = methods.find(m => m.getName() === 'method1' && m.getParameters()[0]?.getType().getText().includes('string'));
        expect(method1_1).toBeDefined();
        expect(getFQN(method1_1!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Class1.method1[MethodDeclaration]');

        const method1_2 = methods.find(m => m.getName() === 'method1' && m.getParameters()[0]?.getType().getText().includes('number'));
        expect(method1_2).toBeDefined();
        expect(getFQN(method1_2!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Class1.2.method1[MethodDeclaration]');

        const method1_3 = methods.find(m => m.getName() === 'method1' && m.getParameters()[0]?.getType().getText().includes('any'));
        expect(method1_3).toBeDefined();
        expect(getFQN(method1_3!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Class1.3.method1[MethodDeclaration]');

        const famixMethod1_1 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace2.Class1.method1[MethodDeclaration]');
        expect(famixMethod1_1).toBeTruthy();
        expect(famixMethod1_1.name).toBe('method1');

        const famixMethod1_2 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace2.Class1.2.method1[MethodDeclaration]');
        expect(famixMethod1_2).toBeTruthy();
        expect(famixMethod1_2.name).toBe('method1');

        const famixMethod1_3 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace2.Class1.3.method1[MethodDeclaration]');
        expect(famixMethod1_3).toBeTruthy();
        expect(famixMethod1_3.name).toBe('method1');
    });

    it('should generate correct FQNs for interface methods in namespace Namespace2.Interface1', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodSignature);
        const method2_1 = methods.find(m => m.getName() === 'method2' && m.getParameters()[0]?.getType().getText().includes('string'));
        expect(method2_1).toBeDefined();
        expect(getFQN(method2_1!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Interface1.method2(string):number[MethodSignature]');

        const method2_2 = methods.find(m => m.getName() === 'method2' && m.getParameters()[0]?.getType().getText().includes('number'));
        expect(method2_2).toBeDefined();
        expect(getFQN(method2_2!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Interface1.2.method2(number):number[MethodSignature]');

        const famixMethod2_1 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace2.Interface1.method2(string):number[MethodSignature]');
        expect(famixMethod2_1).toBeTruthy();
        expect(famixMethod2_1.name).toBe('method2');

        const famixMethod2_2 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace2.Interface1.2.method2(number):number[MethodSignature]');
        expect(famixMethod2_2).toBeTruthy();
        expect(famixMethod2_2.name).toBe('method2');
    });

    it('should generate correct FQNs for parameters in Namespace2.Class1.method1', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const param1_1 = parameters.find(p => p.getName() === 'param1' && p.getType().getText().includes('string'));
        expect(param1_1).toBeDefined();
        expect(getFQN(param1_1!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Class1.method1.param1[Parameter]');

        const param1_2 = parameters.find(p => p.getName() === 'param1' && p.getType().getText().includes('number'));
        expect(param1_2).toBeDefined();
        expect(getFQN(param1_2!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Class1.2.method1.param1[Parameter]');

        const param1_3 = parameters.find(p => p.getName() === 'param1' && p.getType().getText().includes('any'));
        expect(param1_3).toBeDefined();
        expect(getFQN(param1_3!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Class1.3.method1.param1[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam1_1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace2.Class1.method1.param1[Parameter]');
        expect(famixParam1_1).toBeTruthy();
        expect(famixParam1_1?.name).toBe('param1');

        const famixParam1_2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace2.Class1.2.method1.param1[Parameter]');
        expect(famixParam1_2).toBeTruthy();
        expect(famixParam1_2?.name).toBe('param1');

        const famixParam1_3 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace2.Class1.3.method1.param1[Parameter]');
        expect(famixParam1_3).toBeTruthy();
        expect(famixParam1_3?.name).toBe('param1');
    });

    it('should generate correct FQNs for parameters in Namespace2.Interface1.method2', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const param2_1 = parameters.find(p => p.getName() === 'param2' && p.getType().getText().includes('string'));
        expect(param2_1).toBeDefined();
        expect(getFQN(param2_1!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Interface1.method2(string):number.param2[Parameter]');

        const param2_2 = parameters.find(p => p.getName() === 'param2' && p.getType().getText().includes('number'));
        expect(param2_2).toBeDefined();
        expect(getFQN(param2_2!)).toBe('{MethodOverloadFQN.ts}.Namespace2.Interface1.2.method2(number):number.param2[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam2_1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace2.Interface1.method2(string):number.param2[Parameter]');
        expect(famixParam2_1).toBeTruthy();
        expect(famixParam2_1?.name).toBe('param2');

        const famixParam2_2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace2.Interface1.2.method2(number):number.param2[Parameter]');
        expect(famixParam2_2).toBeTruthy();
        expect(famixParam2_2?.name).toBe('param2');
    });

    it('should generate correct FQNs for class methods in namespace Namespace3.Class2', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method3_1 = methods.find(m => m.getName() === 'method3' && m.getParameters()[0]?.getType().getText().includes('boolean'));
        expect(method3_1).toBeDefined();
        expect(getFQN(method3_1!)).toBe('{MethodOverloadFQN.ts}.Namespace3.Class2.method3[MethodDeclaration]');

        const method3_2 = methods.find(m => m.getName() === 'method3' && m.getParameters()[0]?.getType().getText().includes('null'));
        expect(method3_2).toBeDefined();
        expect(getFQN(method3_2!)).toBe('{MethodOverloadFQN.ts}.Namespace3.Class2.2.method3[MethodDeclaration]');

        const famixMethod3_1 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace3.Class2.method3[MethodDeclaration]');
        expect(famixMethod3_1).toBeTruthy();
        expect(famixMethod3_1.name).toBe('method3');

        const famixMethod3_2 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace3.Class2.2.method3[MethodDeclaration]');
        expect(famixMethod3_2).toBeTruthy();
        expect(famixMethod3_2.name).toBe('method3');
    });

    it('should generate correct FQNs for parameters in Namespace3.Class2.method3', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const param3_1 = parameters.find(p => p.getName() === 'param3' && p.getType().getText().includes('boolean'));
        expect(param3_1).toBeDefined();
        expect(getFQN(param3_1!)).toBe('{MethodOverloadFQN.ts}.Namespace3.Class2.method3.param3[Parameter]');

        const param3_2 = parameters.find(p => p.getName() === 'param3' && p.getType().getText().includes('null'));
        expect(param3_2).toBeDefined();
        expect(getFQN(param3_2!)).toBe('{MethodOverloadFQN.ts}.Namespace3.Class2.2.method3.param3[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam3_1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace3.Class2.method3.param3[Parameter]');
        expect(famixParam3_1).toBeTruthy();
        expect(famixParam3_1?.name).toBe('param3');

        const famixParam3_2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace3.Class2.2.method3.param3[Parameter]');
        expect(famixParam3_2).toBeTruthy();
        expect(famixParam3_2?.name).toBe('param3');
    });

    it('should generate correct FQNs for class methods in namespace Namespace4.Class3', () => {
        const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
        const method4_1 = methods.find(m => m.getName() === 'method4' && m.getText().includes('param3: Interface2 | Class3): Class3'));
        expect(method4_1).toBeDefined();
        expect(getFQN(method4_1!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.method4[MethodDeclaration]');

        const method4_2 = methods.find(m => m.getName() === 'method4' && m.getText().includes('param3: Interface2 | Class3 | undefined): Class3 | undefined'));
        expect(method4_2).toBeDefined();
        expect(getFQN(method4_2!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.2.method4[MethodDeclaration]');

        const method4_3 = methods.find(m => m.getName() === 'method4' && m.getText().includes('param3: Interface2 | Class3 | null): Class3 | null'));
        expect(method4_3).toBeDefined();
        expect(getFQN(method4_3!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.3.method4[MethodDeclaration]');

        const method4_4 = methods.find(m => m.getName() === 'method4' && m.getText().includes('param3: Interface2 | Class3 | undefined | null): Class3 | undefined | null'));
        expect(method4_4).toBeDefined();
        expect(getFQN(method4_4!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.4.method4[MethodDeclaration]');

        const famixMethod4_1 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace4.Class3.method4[MethodDeclaration]');
        expect(famixMethod4_1).toBeTruthy();
        expect(famixMethod4_1.name).toBe('method4');

        const famixMethod4_2 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace4.Class3.2.method4[MethodDeclaration]');
        expect(famixMethod4_2).toBeTruthy();
        expect(famixMethod4_2.name).toBe('method4');

        const famixMethod4_3 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace4.Class3.3.method4[MethodDeclaration]');
        expect(famixMethod4_3).toBeTruthy();
        expect(famixMethod4_3.name).toBe('method4');

        const famixMethod4_4 = fmxRep._getFamixMethod('{MethodOverloadFQN.ts}.Namespace4.Class3.4.method4[MethodDeclaration]');
        expect(famixMethod4_4).toBeTruthy();
        expect(famixMethod4_4.name).toBe('method4');
    });

    it('should generate correct FQNs for parameters in Namespace4.Class3.method4', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const param3_1 = parameters.find(p => p.getName() === 'param3' && p.getParent().getText().includes('param3: Interface2 | Class3): Class3'));
        expect(param3_1).toBeDefined();
        expect(getFQN(param3_1!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.method4.param3[Parameter]');

        const param3_2 = parameters.find(p => p.getName() === 'param3' && p.getParent().getText().includes('param3: Interface2 | Class3 | undefined): Class3 | undefined'));
        expect(param3_2).toBeDefined();
        expect(getFQN(param3_2!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.2.method4.param3[Parameter]');

        const param3_3 = parameters.find(p => p.getName() === 'param3' && p.getParent().getText().includes('param3: Interface2 | Class3 | null): Class3 | null'));
        expect(param3_3).toBeDefined();
        expect(getFQN(param3_3!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.3.method4.param3[Parameter]');

        const param3_4 = parameters.find(p => p.getName() === 'param3' && p.getParent().getText().includes('param3: Interface2 | Class3 | undefined | null): Class3 | undefined | null'));
        expect(param3_4).toBeDefined();
        expect(getFQN(param3_4!)).toBe('{MethodOverloadFQN.ts}.Namespace4.Class3.4.method4.param3[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam3_1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace4.Class3.method4.param3[Parameter]');
        expect(famixParam3_1).toBeTruthy();
        expect(famixParam3_1?.name).toBe('param3');

        const famixParam3_2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace4.Class3.2.method4.param3[Parameter]');
        expect(famixParam3_2).toBeTruthy();
        expect(famixParam3_2?.name).toBe('param3');

        const famixParam3_3 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace4.Class3.3.method4.param3[Parameter]');
        expect(famixParam3_3).toBeTruthy();
        expect(famixParam3_3?.name).toBe('param3');

        const famixParam3_4 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace4.Class3.4.method4.param3[Parameter]');
        expect(famixParam3_4).toBeTruthy();
        expect(famixParam3_4?.name).toBe('param3');
    });

    it('should generate correct FQNs for parameters in Namespace1.Module1.function1', () => {
        const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
        const param4_1 = parameters.find(p => p.getName() === 'param4' && p.getParent().getText().includes('param4: Interface3): Interface5<Interface4>'));
        expect(param4_1).toBeDefined();
        expect(getFQN(param4_1!)).toBe('{MethodOverloadFQN.ts}.Namespace1.Module1.function1.param4[Parameter]');

        const param4_2 = parameters.find(p => p.getName() === 'param4' && p.getParent().getText().includes('param4: Interface3, param6?: Interface6'));
        expect(param4_2).toBeDefined();
        expect(getFQN(param4_2!)).toBe('{MethodOverloadFQN.ts}.Namespace1.Module1.2.function1.param4[Parameter]');

        const param5 = parameters.find(p => p.getName() === 'param5' && p.getParent().getText().includes('param5: Interface7, param6?: Interface6'));
        expect(param5).toBeDefined();
        expect(getFQN(param5!)).toBe('{MethodOverloadFQN.ts}.Namespace1.Module1.3.function1.param5[Parameter]');

        const param6_1 = parameters.find(p => p.getName() === 'param6' && p.getParent().getText().includes('param4: Interface3, param6?: Interface6'));
        expect(param6_1).toBeDefined();
        expect(getFQN(param6_1!)).toBe('{MethodOverloadFQN.ts}.Namespace1.Module1.2.function1.param6[Parameter]');

        const param6_2 = parameters.find(p => p.getName() === 'param6' && p.getParent().getText().includes('param5: Interface7, param6?: Interface6'));
        expect(param6_2).toBeDefined();
        expect(getFQN(param6_2!)).toBe('{MethodOverloadFQN.ts}.Namespace1.Module1.3.function1.param6[Parameter]');

        const famixParameters = fmxRep._getAllEntitiesWithType('Parameter') as Set<Famix.Parameter>;
        const famixParam4_1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace1.Module1.function1.param4[Parameter]');
        expect(famixParam4_1).toBeTruthy();
        expect(famixParam4_1?.name).toBe('param4');

        const famixParam4_2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace1.Module1.2.function1.param4[Parameter]');
        expect(famixParam4_2).toBeTruthy();
        expect(famixParam4_2?.name).toBe('param4');

        const famixParam5 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace1.Module1.3.function1.param5[Parameter]');
        expect(famixParam5).toBeTruthy();
        expect(famixParam5?.name).toBe('param5');

        const famixParam6_1 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace1.Module1.2.function1.param6[Parameter]');
        expect(famixParam6_1).toBeTruthy();
        expect(famixParam6_1?.name).toBe('param6');

        const famixParam6_2 = Array.from(famixParameters).find(p => p.fullyQualifiedName === '{MethodOverloadFQN.ts}.Namespace1.Module1.3.function1.param6[Parameter]');
        expect(famixParam6_2).toBeTruthy();
        expect(famixParam6_2?.name).toBe('param6');
    });
});