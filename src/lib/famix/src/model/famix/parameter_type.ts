import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { ParameterizableClass } from "./parameterizable_class";
import { ParameterizableInterface } from "./parameterizable_interface";
import { Method } from "./method";
import { Function as FamixFunction } from "./function";
import { Accessor } from "./accessor";

export class ParameterType extends Type {

  private parentGeneric: ParameterizableClass | ParameterizableInterface | Method | Accessor | FamixFunction;

  public getParentGeneric(): ParameterizableClass | ParameterizableInterface | Method | Accessor | FamixFunction {
    return this.parentGeneric;
  }

  public setParentGeneric(parentGeneric: ParameterizableClass | ParameterizableInterface | Method | Accessor | FamixFunction): void {
    this.parentGeneric = parentGeneric;
    parentGeneric.addParameterType(this);
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ParameterType", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("parentGeneric", this.getParentGeneric());
  }
}
