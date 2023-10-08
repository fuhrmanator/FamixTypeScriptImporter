import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { ParameterizableClass } from "./parameterizable_class";
import { ParameterizableInterface } from "./parameterizable_interface";
import { Method } from "./method";
import { Function } from "./function";
import { Accessor } from "./accessor";

export class TypeParameter extends Type {

  private parentGeneric: ParameterizableClass | ParameterizableInterface | Method | Accessor | Function;

  public getParentGeneric(): ParameterizableClass | ParameterizableInterface | Method | Accessor | Function {
    return this.parentGeneric;
  }

  public setParentGeneric(parentGeneric: ParameterizableClass | ParameterizableInterface | Method | Accessor | Function): void {
    this.parentGeneric = parentGeneric;
    parentGeneric.addTypeParameter(this);
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("TypeParameter", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("parentGeneric", this.getParentGeneric());
  }
}
