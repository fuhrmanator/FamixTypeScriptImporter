import { EntityDictionary } from "../src/famix_functions/EntityDictionary";
import * as Famix from "../src/lib/famix/model/famix";
import { project } from './testUtils';

// TODO: ⏳ This test is not in a sync with a current solution. Fix the test.
//       🛠️ Fix code to pass the tests and remove .skip

const sourceFile = project.createSourceFile("/entityDictionaryUnit.ts",
`
namespace MyNamespace {
    
  class EntityClass {
    
    public name: string;

    constructor(name: string) {
      
      this.name = name;
    
    }
  
  }

  function fct3() {
  }

}
`);

describe.skip('EntityDictionary', () => {

  // const modules = sourceFile.getModules();
  // const config = { expectGraphemes: false };
  // const entityDictionary = new EntityDictionary(config);

  it('should get a module/namespace and add it to the map', () => {
    
    // //Create a type namespace declaration
    // const namespace : Famix.Module = entityDictionary.ensureFamixModule(modules[0]);
    // expect(modules[0]).toBe(entityDictionary.fmxElementObjectMap.get(namespace));  
  
  });

  // const classes = modules[0].getClasses();

  // it('should get a class and add it to the map', () => {
    
  //   //Create a type class declaration   
  //   const classe : Famix.Class | Famix.ParametricClass = entityDictionary.ensureFamixClass(classes[0]);
  //   expect(classes[0]).toBe(entityDictionary.fmxElementObjectMap.get(classe));  
  
  // });

  // const properties = classes[0].getProperties();

  // it('should get a property and add it to the map', () => {
    
  //   //Create a type property declaration   
  //   const property : Famix.Property = entityDictionary.ensureFamixProperty(properties[0]);
  //   expect(properties[0]).toBe(entityDictionary.fmxElementObjectMap.get(property));  
  
  // });

  // const constructors = classes[0].getConstructors();

  // it('should get a constructor and add it to the map', () => {
    
  //   //Create a type constructor declaration   
  //   const constructor : Famix.Method | Famix.Accessor = entityDictionary.createOrGetFamixMethod(constructors[0], {});
  //   expect(constructors[0]).toBe(entityDictionary.fmxElementObjectMap.get(constructor));  
  
  // });

  // const parameters = constructors[0].getParameters();

  // it('should get parameters of the constructors and add it to the map', () => {
    
  //   //Create a type parameter declaration   
  //   const parameter : Famix.Parameter = entityDictionary.createOrGetFamixParameter(parameters[0]);
  //   expect(parameters[0]).toBe(entityDictionary.fmxElementObjectMap.get(parameter));  
  
  // });

  // const functions = modules[0].getFunctions();

  // it('should get a function and add it to the map', () => {
    
  //   //Create a type function declaration   
  //   const famixFunction : Famix.Function = entityDictionary.createOrGetFamixFunction(functions[0], {});

  //   expect(functions[0]).toBe(entityDictionary.fmxElementObjectMap.get(famixFunction));  
  
  // });
  
});
