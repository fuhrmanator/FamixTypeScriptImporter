import { FamixBaseElement } from "./famix_base_element";
import { Class, Interface, Namespace, Variable, Method, Function as FamixFunctionEntity, Type, NamedEntity, ScriptEntity, Module, SourceLanguage } from "./model/famix";

/**
 * This class is used to store all Famix elements
 */
export class FamixRepository {
  private elements = new Set<FamixBaseElement>(); // All Famix elements
  private famixClasses = new Set<Class>(); // All Famix classes
  private famixInterfaces = new Set<Interface>(); // All Famix interfaces
  private famixNamespaces = new Set<Namespace>(); // All Famix namespaces
  private famixMethods = new Set<Method>(); // All Famix methods
  private famixVariables = new Set<Variable>(); // All Famix variables
  private famixFunctions = new Set<FamixFunctionEntity>(); // All Famix functions
  private famixFiles = new Set<ScriptEntity | Module>(); // All Famix files
  private idCounter = 1; // Id counter
  private absolutePath: string = "";

  constructor() {
    this.addElement(new SourceLanguage());  // add the source language entity (TypeScript)
  }

  public getAbsolutePath() : string {
    return this.absolutePath;
  }

  public setAbsolutePath( path: string ){
    this.absolutePath = path;
  }

  /**
   * Gets a Famix entity by id
   * @param id An id of a Famix entity
   * @returns The Famix entity corresponding to the id or undefined if it doesn't exist
   */
  public getFamixEntityById(id: number): FamixBaseElement | undefined {
    const entity = Array.from(this.elements.values()).find(e => e.id === id);
    return entity;
  }

  /**
   * Gets a Famix entity by fully qualified name
   * @param fullyQualifiedName A fully qualified name
   * @returns The Famix entity corresponding to the fully qualified name or undefined if it doesn't exist
   */
  public getFamixEntityByFullyQualifiedName(fullyQualifiedName: string): FamixBaseElement | undefined {
    const allEntities = Array.from(this.elements.values()).filter(e => e instanceof NamedEntity) as Array<NamedEntity>;
    const entity = allEntities.find(e => e.getFullyQualifiedName() === fullyQualifiedName);
    return entity;
  }

  export(arg0: { format: string; }) {
    if(arg0.format === "json") {
      return this.getJSON();
    }
  }


  // Only for tests

  /**
   * Gets all Famix entities
   * @returns All Famix entities
   */
  public _getAllEntities(): Set<FamixBaseElement> {
    return new Set(Array.from(this.elements.values()));
  }

  /**
   * Gets all Famix entities of a given type
   * @param theType A type of Famix entity
   * @returns All Famix entities of the given type
   */
  public _getAllEntitiesWithType(theType: string): Set<FamixBaseElement> {
    return new Set(Array.from(this.elements.values()).filter(e => (e as any).constructor.name === theType));
  }

  /**
   * Gets a Famix class by name
   * @param name A class name
   * @returns The Famix class corresponding to the name or undefined if it doesn't exist
   */
  public _getFamixClass(fullyQualifiedName: string): Class | undefined {
    return Array.from(this.famixClasses.values()).find(ns => ns.getFullyQualifiedName() === fullyQualifiedName);
  }

  /**
   * Gets a Famix interface by name
   * @param name An interface name
   * @returns The Famix interface corresponding to the name or undefined if it doesn't exist
   */
  public _getFamixInterface(fullyQualifiedName: string): Interface | undefined {
    return Array.from(this.famixInterfaces.values()).find(ns => ns.getFullyQualifiedName() === fullyQualifiedName);
  }

  /**
   * Gets a Famix method by name
   * @param name A method name
   * @returns The Famix method corresponding to the name or undefined if it doesn't exist
   */
  public _getFamixMethod(fullyQualifiedName: string): Method | undefined {
    return Array.from(this.famixMethods.values()).find(ns => ns.getFullyQualifiedName() === fullyQualifiedName);
  }

  /**
   * Gets a Famix function by name
   * @param name A function name
   * @returns The Famix function corresponding to the name or undefined if it doesn't exist
   */
  public _getFamixFunction(fullyQualifiedName: string): FamixFunctionEntity | undefined {
    return Array.from(this.famixFunctions.values()).find(ns => ns.getFullyQualifiedName() === fullyQualifiedName);
  }


  /**
   * Gets a Famix variable by name
   * @param name A variable name
   * @returns The Famix variable corresponding to the name or undefined if it doesn't exist
   */
  public _getFamixVariable(fullyQualifiedName: string): Variable | undefined {
    return Array.from(this.famixVariables.values()).find(v => v.getFullyQualifiedName() === fullyQualifiedName);
  }

  /**
   * Gets a Famix namespace by name
   * @param name A namespace name
   * @returns The Famix namespace corresponding to the name or undefined if it doesn't exist
   */
  public _getFamixNamespace(fullyQualifiedName: string): Namespace | undefined {
    return Array.from(this.famixNamespaces.values()).find(ns => ns.getFullyQualifiedName() === fullyQualifiedName);
  }

  /**
   * Gets all Famix namespaces
   * @returns All Famix namespaces
   */
  public _getFamixNamespaces(): Set<Namespace> {
    return new Set(Array.from(this.famixNamespaces.values()));
  }

  /**
   * Gets a Famix file by name
   * @param name A file name
   * @returns The Famix file corresponding to the name or undefined if it doesn't exist
   */
  public _getFamixFile(fullyQualifiedName: string): ScriptEntity | Module | undefined {
    return Array.from(this.famixFiles.values()).find(ns => ns.getName() === fullyQualifiedName);
  }

  /**
   * Gets all Famix files
   * @returns All Famix files
   */
  public _getFamixFiles(): Set<ScriptEntity | Module> {
    return new Set(Array.from(this.famixFiles.values()));
  }

  /**
   * Gets all method names as a set from a class
   * @param className A class name
   * @returns The set of class "className" method names
   */
  public _methodNamesAsSetFromClass(className: string): Set<string> {
    const theClass = this._getFamixClass(className) as Class;
    return new Set(Array.from(theClass.getMethods()).map(m => m.getName()));
  }

  /**
   * Gets all method parents as a set from a class
   * @param className A class name
   * @returns The set of class "className" method parents
   */
  public _methodParentsAsSetFromClass(className: string): Set<Type> {
    const theClass = this._getFamixClass(className) as Class;
    return new Set(Array.from(theClass.getMethods()).map(m => m.getParentEntity()));
  }

  /**
   * Gets the map of Famix element ids and their Famix element from a JSON model
   * @param model A JSON model
   * @returns The map of Famix element ids and their Famix element from the JSON model
   */
  public _initMapFromModel(model: string): Map<number, unknown> {
    const parsedModel: Array<any> = JSON.parse(model);
    const idToElementMap: Map<number, unknown> = new Map();
    parsedModel.forEach(element => {
        idToElementMap.set(element.id, element);
    });
    return idToElementMap;
  }


  /**
   * Adds a Famix element to the repository
   * @param element A Famix element
   */
  public addElement(element: FamixBaseElement): void {
    if (element instanceof Class) {
      this.famixClasses.add(element);
    } else if (element instanceof Interface) {
      this.famixInterfaces.add(element);
    } else if (element instanceof Namespace) {
      this.famixNamespaces.add(element);
    } else if (element instanceof Variable) {
      this.famixVariables.add(element);
    } else if (element instanceof Method) {
      this.famixMethods.add(element);
    } else if (element instanceof FamixFunctionEntity) {
      this.famixFunctions.add(element);
    } else if (element instanceof ScriptEntity || element instanceof Module) {
      this.famixFiles.add(element);
    }
    this.elements.add(element);
    element.id = this.idCounter;
    this.idCounter++;
  }

  /**
   * Gets a JSON representation of the repository
   * @returns A JSON representation of the repository
   */
  public getJSON(): string {
    let ret = "[";
    for (const element of Array.from(this.elements.values())) {
      ret = ret + element.getJSON() + ",";
    }
    ret = ret.substring(0, ret.length - 1);
    return ret + "]";
  }
}
