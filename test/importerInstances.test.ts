import { Importer } from '../src/analyze';
import { createProject } from './testUtils';

describe('Multiple Importer Instances', () => {
  const sourceCode1 = `
    class Class1 {
      property1: string;
      method1() {}
    }
  `;

  const sourceCode2 = `
    class Class2 {
      property2: number;
      method2() {}
    }
  `;


  it('should handle multiple importer instances independently', () => {
    const importer1 = new Importer();
    const importer2 = new Importer();

    const project1 = createProject();
    const project2 = createProject();

    project1.createSourceFile('sourceCode1.ts', sourceCode1);
    project2.createSourceFile('sourceCode2.ts', sourceCode2);

    const famixRep1 = importer1.famixRepFromProject(project1);
    const famixRep2 = importer2.famixRepFromProject(project2);

    const class1 = famixRep1._getFamixClass('{sourceCode1.ts}.Class1[ClassDeclaration]');
    const class2 = famixRep2._getFamixClass('{sourceCode2.ts}.Class2[ClassDeclaration]');

    expect(class1).not.toBeUndefined();
    expect(class2).not.toBeUndefined();

    expect(famixRep1._getFamixClass('{sourceCode2.ts}.Class2[ClassDeclaration]')).toBeUndefined();
    expect(famixRep2._getFamixClass('{sourceCode1.ts}.Class1[ClassDeclaration]')).toBeUndefined();
  });

  it('should handle multiple importers processing in parallel without interference', () => {
    const importer1 = new Importer();
    const importer2 = new Importer();
    const importer3 = new Importer();

    const project1 = createProject();
    const project2 = createProject();
    const project3 = createProject();

    const complexSource1 = `
      class BaseClass {
        baseMethod() {}
      }
      class DerivedClass extends BaseClass {
        derivedMethod() {}
      }
    `;

    const complexSource2 = `
      interface ITest {
        testMethod(): void;
      }
      class ImplementingClass implements ITest {
        testMethod() {}
      }
    `;

    const complexSource3 = `
      class ClassWithAccess {
        property: string = "test";
        method() {
          const local = this.property;
        }
      }
    `;

    project1.createSourceFile('sourceCode1.ts', complexSource1);
    project2.createSourceFile('sourceCode2.ts', complexSource2);
    project3.createSourceFile('sourceCode3.ts', complexSource3);

    const famixRep1 = importer1.famixRepFromProject(project1);
    const famixRep2 = importer2.famixRepFromProject(project2);
    const famixRep3 = importer3.famixRepFromProject(project3);

    const baseClassFqn = '{sourceCode1.ts}.BaseClass[ClassDeclaration]';
    const derivedClassFqn = '{sourceCode1.ts}.DerivedClass[ClassDeclaration]';
    const interfaceFqn = '{sourceCode2.ts}.ITest[InterfaceDeclaration]';
    const implementingClassFqn = '{sourceCode2.ts}.ImplementingClass[ClassDeclaration]';
    const classWithAccessFqn = '{sourceCode3.ts}.ClassWithAccess[ClassDeclaration]';

    expect(famixRep1._getFamixClass(baseClassFqn)).not.toBeUndefined();
    expect(famixRep1._getFamixClass(derivedClassFqn)).not.toBeUndefined();
    expect(famixRep2._getFamixInterface(interfaceFqn)).not.toBeUndefined();
    expect(famixRep2._getFamixClass(implementingClassFqn)).not.toBeUndefined();

    expect(famixRep3._getFamixClass(classWithAccessFqn)).not.toBeUndefined();

    expect(famixRep1._getFamixInterface(interfaceFqn)).toBeUndefined();
    expect(famixRep2._getFamixClass(baseClassFqn)).toBeUndefined();
    expect(famixRep3._getFamixClass(derivedClassFqn)).toBeUndefined();
  });
  
  it('should correctly handle imports between files in separate importers', () => {
    const importer1 = new Importer();
    const importer2 = new Importer();

    const project1 = createProject();
    const project2 = createProject();

    const moduleA1 = `
      export class BaseModule {
        sharedMethod() {
          return 'shared functionality';
        }
      }
    `;

    const moduleB1 = `
      import { BaseModule } from './moduleA';
      
      export class ExtendedModule extends BaseModule {
        extendedMethod() {
          return this.sharedMethod() + ' with extensions';
        }
      }
    `;

    const moduleA2 = `
      export interface IService {
        execute(): void;
      }
      
      export class DefaultService implements IService {
        execute() {
          console.log('Default implementation');
        }
      }
    `;

    const moduleB2 = `
      import { IService } from './moduleA';
      
      export class CustomService implements IService {
        execute() {
          console.log('Custom implementation');
        }
      }
      
      export class ServiceRegistry {
        services: IService[] = [];
        register(service: IService) {
          this.services.push(service);
        }
      }
    `;

    project1.createSourceFile('moduleA.ts', moduleA1);
    project1.createSourceFile('moduleB.ts', moduleB1);
    
    project2.createSourceFile('moduleA.ts', moduleA2);
    project2.createSourceFile('moduleB.ts', moduleB2);

    const famixRep1 = importer1.famixRepFromProject(project1);
    const famixRep2 = importer2.famixRepFromProject(project2);

    const baseModuleFqn = '{moduleA.ts}.BaseModule[ClassDeclaration]';
    const extendedModuleFqn = '{moduleB.ts}.ExtendedModule[ClassDeclaration]';
    
    const iServiceFqn = '{moduleA.ts}.IService[InterfaceDeclaration]';
    const defaultServiceFqn = '{moduleA.ts}.DefaultService[ClassDeclaration]';
    const customServiceFqn = '{moduleB.ts}.CustomService[ClassDeclaration]';
    const serviceRegistryFqn = '{moduleB.ts}.ServiceRegistry[ClassDeclaration]';

    expect(famixRep1._getFamixClass(baseModuleFqn)).not.toBeUndefined();
    expect(famixRep1._getFamixClass(extendedModuleFqn)).not.toBeUndefined();
    
    expect(famixRep2._getFamixInterface(iServiceFqn)).not.toBeUndefined();
    expect(famixRep2._getFamixClass(defaultServiceFqn)).not.toBeUndefined();
    expect(famixRep2._getFamixClass(customServiceFqn)).not.toBeUndefined();
    expect(famixRep2._getFamixClass(serviceRegistryFqn)).not.toBeUndefined();

    expect(famixRep1._getFamixInterface(iServiceFqn)).toBeUndefined();
    expect(famixRep1._getFamixClass(customServiceFqn)).toBeUndefined();
    
    expect(famixRep2._getFamixClass(baseModuleFqn)).toBeUndefined();
    expect(famixRep2._getFamixClass(extendedModuleFqn)).toBeUndefined();

    const extendedModule = famixRep1._getFamixClass(extendedModuleFqn);
    expect(extendedModule?.superInheritances.size).toBe(1);
    
    const customService = famixRep2._getFamixClass(customServiceFqn);
    const defaultService = famixRep2._getFamixClass(defaultServiceFqn);
    expect(customService?.superInheritances.size).toBe(1);
    expect(defaultService?.superInheritances.size).toBe(1);
  });
});