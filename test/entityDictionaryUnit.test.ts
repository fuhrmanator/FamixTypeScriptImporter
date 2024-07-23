import { Project, ClassDeclaration, ConstructorDeclaration, FunctionDeclaration, Identifier, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, PropertyDeclaration, PropertySignature, SourceFile, TypeParameterDeclaration, VariableDeclaration, ParameterDeclaration, Decorator, GetAccessorDeclaration, SetAccessorDeclaration, ImportSpecifier, CommentRange, EnumDeclaration, EnumMember, TypeAliasDeclaration, FunctionExpression, ExpressionWithTypeArguments, ImportDeclaration } from "ts-morph";
import { entityDictionary } from "../src/analyze";
import * as Famix from "../src/lib/famix/src/model/famix";

const project = new Project(
  {
    compilerOptions: {
        baseUrl: "./src"
    }
  }
);

const sourceFile = project.createSourceFile("./src/entityDictionaryUnit.ts",
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

describe('EntityDictionary', () => {

  const modules = sourceFile.getModules();

  test('should get a module/namespace and add it to the map', () => {
    
    //Create a type namespace declaration
    const namespace : Famix.Module = entityDictionary.createOrGetFamixModule(modules[0]);
    expect(modules[0]).toBe(entityDictionary.fmxElementObjectMap.get(namespace));  
  
  });

  const classes = modules[0].getClasses();

  test('should get a class and add it to the map', () => {
    
    //Create a type class declaration   
    const classe : Famix.Class | Famix.ParametricClass = entityDictionary.createOrGetFamixClass(classes[0]);
    expect(classes[0]).toBe(entityDictionary.fmxElementObjectMap.get(classe));  
  
  });

  const properties = classes[0].getProperties();

  test('should get a property and add it to the map', () => {
    
    //Create a type property declaration   
    const property : Famix.Property = entityDictionary.createFamixProperty(properties[0]);
    expect(properties[0]).toBe(entityDictionary.fmxElementObjectMap.get(property));  
  
  });

  const constructors = classes[0].getConstructors();

  test('should get a constructor and add it to the map', () => {
    
    //Create a type constructor declaration   
    const constructor : Famix.Method | Famix.Accessor = entityDictionary.createOrGetFamixMethod(constructors[0],0);
    expect(constructors[0]).toBe(entityDictionary.fmxElementObjectMap.get(constructor));  
  
  });

  const parameters = constructors[0].getParameters();

  test('should get parameters of the constructors and add it to the map', () => {
    
    //Create a type parameter declaration   
    const parameter : Famix.Parameter = entityDictionary.createFamixParameter(parameters[0]);
    expect(parameters[0]).toBe(entityDictionary.fmxElementObjectMap.get(parameter));  
  
  });

  const functions = modules[0].getFunctions();

  test('should get a function and add it to the map', () => {
    
    //Create a type function declaration   
    const famixFunction : Famix.Function = entityDictionary.createOrGetFamixFunction(functions[0],0);

    expect(functions[0]).toBe(entityDictionary.fmxElementObjectMap.get(famixFunction));  
  
  });
  
});
