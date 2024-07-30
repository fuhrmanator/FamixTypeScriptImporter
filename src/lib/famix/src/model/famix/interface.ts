import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { Method } from "./method";
import { Property } from "./property";
import { Inheritance } from "./inheritance";

export class Interface extends Type {

  private properties: Set<Property> = new Set();

  public getProperties(): Set<Property> {
    return this.properties;
  }

  public addProperty(property: Property): void {
    if (!this.properties.has(property)) {
      this.properties.add(property);
      property.setParentEntity(this);
    }
  }

  private methods: Set<Method> = new Set();

  public getMethods(): Set<Method> {
    return this.methods;
  }

  public addMethod(method: Method): void {
    if (!this.methods.has(method)) {
      this.methods.add(method);
      method.setParentEntity(this);
    }
  }

  private superInheritances: Set<Inheritance> = new Set();

  public getSuperInheritances(): Set<Inheritance> {
    return this.superInheritances;
  }

  public addSuperInheritance(superInheritance: Inheritance): void {
    if (!this.superInheritances.has(superInheritance)) {
      this.superInheritances.add(superInheritance);
      superInheritance.setSubclass(this);
    }
  }

  private subInheritances: Set<Inheritance> = new Set();

  public getSubInheritances(): Set<Inheritance> {
    return this.subInheritances;
  }

  public addSubInheritance(subInheritance: Inheritance): void {
    if (!this.subInheritances.has(subInheritance)) {
      this.subInheritances.add(subInheritance);
      subInheritance.setSuperclass(this);
    }
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Interface", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("attributes", this.getProperties());
    exporter.addProperty("methods", this.getMethods());
    exporter.addProperty("superInheritances", this.getSuperInheritances());
    exporter.addProperty("subInheritances", this.getSubInheritances());  
  }
}
