import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Association } from "./association";
import { Class } from "./class";
import { Interface } from "./interface";

export class Inheritance extends Association {

  private superclass: Class | Interface;

  public getSuperclass(): Class  | Interface {
    return this.superclass;
  }

  public setSuperclass(superclass: Class | Interface): void {
    this.superclass = superclass;
    superclass.addSubInheritance(this);
  }

  private subclass: Class | Interface;

  public getSubclass(): Class | Interface {
    return this.subclass;
  }

  public setSubclass(subclass: Class | Interface): void {
    this.subclass = subclass;
    subclass.addSuperInheritance(this);
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Inheritance", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("superclass", this.getSuperclass());
    exporter.addProperty("subclass", this.getSubclass());
  }
}
