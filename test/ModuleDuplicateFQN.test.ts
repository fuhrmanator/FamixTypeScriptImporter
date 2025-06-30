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

describe('Duplicate Module FQN Generation', () => {
    let sourceFile: ReturnType<Project['createSourceFile']>;
    let importer: Importer;
    let fmxRep: any;

    beforeAll(() => {
        sourceFile = project.createSourceFile('/ModuleDuplicateFQN.ts', `
            declare namespace Namespace1 {
                class Class1 {
                    prop1: string;
                }
            }
            declare namespace Namespace1 {
                class Class2 {
                    prop2: number;
                }
            }
            declare namespace ParentNamespace {
                declare namespace Inner {
                    function func1(): void;
                }
                declare namespace Inner {
                    class Class3 {
                        prop3: boolean;
                    }
                }
                declare namespace Inner {
                    module SubInner {
                        function func2(): void;
                    }
                }
            }
            declare namespace TopLevel {
                declare namespace Inner {
                    class Class4 {
                        prop4: any;
                    }
                }
            }
        `);

        importer = new Importer();
        fmxRep = importer.famixRepFromProject(project);
        // Debug: Log all Module entities
        console.log('Famix Modules:', Array.from(fmxRep._getAllEntitiesWithType('Module')).map((m: any) => m.fullyQualifiedName));
    });

    it('should parse the source file and generate Famix representation', () => {
        expect(fmxRep).toBeTruthy();
        expect(sourceFile).toBeTruthy();
    });

    it('should generate unique FQNs for duplicate top-level modules (Namespace1)', () => {
        const modules = sourceFile.getDescendantsOfKind(SyntaxKind.ModuleDeclaration);

        const namespace1_1 = modules.find(m => m.getName() === 'Namespace1' && m.getClasses().some(c => c.getName() === 'Class1'));
        expect(namespace1_1).toBeDefined();
        expect(getFQN(namespace1_1!)).toBe('{ModuleDuplicateFQN.ts}.Namespace1[ModuleDeclaration]');

        const namespace1_2 = modules.find(m => m.getName() === 'Namespace1' && m.getClasses().some(c => c.getName() === 'Class2'));
        expect(namespace1_2).toBeDefined();
        expect(getFQN(namespace1_2!)).toBe('{ModuleDuplicateFQN.ts}.2.Namespace1[ModuleDeclaration]');

        const famixModules = fmxRep._getAllEntitiesWithType('Module') as Set<Famix.Module>;
        const famixNamespace1_1 = Array.from(famixModules).find(m => m.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.Namespace1[ModuleDeclaration]');
        expect(famixNamespace1_1).toBeTruthy();
        expect(famixNamespace1_1?.name).toBe('Namespace1');

        const famixNamespace1_2 = Array.from(famixModules).find(m => m.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.2.Namespace1[ModuleDeclaration]');
        expect(famixNamespace1_2).toBeTruthy();
        expect(famixNamespace1_2?.name).toBe('Namespace1');
    });

    it('should generate unique FQNs for duplicate nested modules in ParentNamespace (Inner)', () => {
        const modules = sourceFile.getDescendantsOfKind(SyntaxKind.ModuleDeclaration);

        const inner1 = modules.find(m => m.getName() === 'Inner' && m.getFunctions().some(f => f.getName() === 'func1'));
        expect(inner1).toBeDefined();
        expect(getFQN(inner1!)).toBe('{ModuleDuplicateFQN.ts}.ParentNamespace.Inner[ModuleDeclaration]');

        const inner2 = modules.find(m => m.getName() === 'Inner' && m.getClasses().some(c => c.getName() === 'Class3'));
        expect(inner2).toBeDefined();
        expect(getFQN(inner2!)).toBe('{ModuleDuplicateFQN.ts}.ParentNamespace.2.Inner[ModuleDeclaration]');

        const subInner = modules.find(m => m.getName() === 'SubInner' && m.getFunctions().some(f => f.getName() === 'func2'));
        expect(subInner).toBeDefined();
        expect(getFQN(subInner!)).toBe('{ModuleDuplicateFQN.ts}.ParentNamespace.3.Inner.SubInner[ModuleDeclaration]');

        const famixModules = fmxRep._getAllEntitiesWithType('Module') as Set<Famix.Module>;
        const famixInner1 = Array.from(famixModules).find(m => m.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.ParentNamespace.Inner[ModuleDeclaration]');
        expect(famixInner1).toBeTruthy();
        expect(famixInner1?.name).toBe('Inner');

        const famixInner2 = Array.from(famixModules).find(m => m.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.ParentNamespace.2.Inner[ModuleDeclaration]');
        expect(famixInner2).toBeTruthy();
        expect(famixInner2?.name).toBe('Inner');

        const famixSubInner = Array.from(famixModules).find(m => m.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.ParentNamespace.3.Inner.SubInner[ModuleDeclaration]');
        expect(famixSubInner).toBeTruthy();
        expect(famixSubInner?.name).toBe('SubInner');
    });

    it('should generate correct FQNs for nested module in TopLevel (Inner)', () => {
        const modules = sourceFile.getDescendantsOfKind(SyntaxKind.ModuleDeclaration);

        const inner = modules.find(m => m.getName() === 'Inner' && m.getClasses().some(c => c.getName() === 'Class4'));
        expect(inner).toBeDefined();
        expect(getFQN(inner!)).toBe('{ModuleDuplicateFQN.ts}.TopLevel.Inner[ModuleDeclaration]');

        const famixModules = fmxRep._getAllEntitiesWithType('Module') as Set<Famix.Module>;
        const famixInner = Array.from(famixModules).find(m => m.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.TopLevel.Inner[ModuleDeclaration]');
        expect(famixInner).toBeTruthy();
        expect(famixInner?.name).toBe('Inner');
    });

it('should generate correct FQNs for entities inside duplicate modules', () => {
        const classes = sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration);
        const properties = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyDeclaration);
        const functions = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);

        // Class1 in first Namespace1
        const class1 = classes.find(c => c.getName() === 'Class1');
        expect(class1).toBeDefined();
        expect(getFQN(class1!)).toBe('{ModuleDuplicateFQN.ts}.Namespace1.Class1[ClassDeclaration]');

        const prop1 = properties.find(p => p.getName() === 'prop1');
        expect(prop1).toBeDefined();
        expect(getFQN(prop1!)).toBe('{ModuleDuplicateFQN.ts}.Namespace1.Class1.prop1[PropertyDeclaration]');

        // Class2 in second Namespace1
        const class2 = classes.find(c => c.getName() === 'Class2');
        expect(class2).toBeDefined();
        expect(getFQN(class2!)).toBe('{ModuleDuplicateFQN.ts}.2.Namespace1.Class2[ClassDeclaration]');

        const prop2 = properties.find(p => p.getName() === 'prop2');
        expect(prop2).toBeDefined();
        expect(getFQN(prop2!)).toBe('{ModuleDuplicateFQN.ts}.2.Namespace1.Class2.prop2[PropertyDeclaration]');

        // func1 in ParentNamespace.Inner
        const func1 = functions.find(f => f.getName() === 'func1');
        expect(func1).toBeDefined();
        expect(getFQN(func1!)).toBe('{ModuleDuplicateFQN.ts}.ParentNamespace.Inner.func1[FunctionDeclaration]');

        // Class3 in ParentNamespace.2.Inner
        const class3 = classes.find(c => c.getName() === 'Class3');
        expect(class3).toBeDefined();
        expect(getFQN(class3!)).toBe('{ModuleDuplicateFQN.ts}.ParentNamespace.2.Inner.Class3[ClassDeclaration]');

        const prop3 = properties.find(p => p.getName() === 'prop3');
        expect(prop3).toBeDefined();
        expect(getFQN(prop3!)).toBe('{ModuleDuplicateFQN.ts}.ParentNamespace.2.Inner.Class3.prop3[PropertyDeclaration]');

        // func2 in ParentNamespace.3.Inner.SubInner
        const func2 = functions.find(f => f.getName() === 'func2');
        expect(func2).toBeDefined();
        expect(getFQN(func2!)).toBe('{ModuleDuplicateFQN.ts}.ParentNamespace.3.Inner.SubInner.func2[FunctionDeclaration]');

        // Class4 in TopLevel.Inner
        const class4 = classes.find(c => c.getName() === 'Class4');
        expect(class4).toBeDefined();
        expect(getFQN(class4!)).toBe('{ModuleDuplicateFQN.ts}.TopLevel.Inner.Class4[ClassDeclaration]');

        const prop4 = properties.find(p => p.getName() === 'prop4');
        expect(prop4).toBeDefined();
        expect(getFQN(prop4!)).toBe('{ModuleDuplicateFQN.ts}.TopLevel.Inner.Class4.prop4[PropertyDeclaration]');

        // Famix entity checks
        const famixClasses = fmxRep._getAllEntitiesWithType('Class') as Set<Famix.Class>;
        const famixProperties = fmxRep._getAllEntitiesWithType('Property') as Set<Famix.Property>;
        const famixFunctions = fmxRep._getAllEntitiesWithType('Function') as Set<Famix.Function>;

        expect(Array.from(famixClasses).find(c => c.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.Namespace1.Class1[ClassDeclaration]')).toBeTruthy();
        expect(Array.from(famixProperties).find(p => p.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.Namespace1.Class1.prop1[PropertyDeclaration]')).toBeTruthy();
        expect(Array.from(famixClasses).find(c => c.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.2.Namespace1.Class2[ClassDeclaration]')).toBeTruthy();
        expect(Array.from(famixProperties).find(p => p.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.2.Namespace1.Class2.prop2[PropertyDeclaration]')).toBeTruthy();
        expect(Array.from(famixFunctions).find(f => f.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.ParentNamespace.Inner.func1[FunctionDeclaration]')).toBeTruthy();
        expect(Array.from(famixClasses).find(c => c.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.ParentNamespace.2.Inner.Class3[ClassDeclaration]')).toBeTruthy();
        expect(Array.from(famixProperties).find(p => p.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.ParentNamespace.2.Inner.Class3.prop3[PropertyDeclaration]')).toBeTruthy();
        expect(Array.from(famixFunctions).find(f => f.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.ParentNamespace.3.Inner.SubInner.func2[FunctionDeclaration]')).toBeTruthy();
        expect(Array.from(famixClasses).find(c => c.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.TopLevel.Inner.Class4[ClassDeclaration]')).toBeTruthy();
        expect(Array.from(famixProperties).find(p => p.fullyQualifiedName === '{ModuleDuplicateFQN.ts}.TopLevel.Inner.Class4.prop4[PropertyDeclaration]')).toBeTruthy();
    });
});