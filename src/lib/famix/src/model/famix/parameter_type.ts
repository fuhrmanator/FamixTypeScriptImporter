import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { ParametricClass } from "./parametric_class";
import { ParametricInterface } from "./parametric_interface";
import { Method } from "./method";
import { Function as FamixFunction } from "./function";
import { Accessor } from "./accessor";
import { ParametricMethod } from "./parametric_method";
import { ParametricFunction } from "./parametric_function";
import { ArrowFunction } from "./arrowFunction";
import { ParametricArrowFunction } from "./parametricArrowFunction";

export class ParameterType extends Type {

  private parentGeneric: ParametricClass | ParametricInterface | Method | ParametricMethod | Accessor | FamixFunction | ParametricFunction | ArrowFunction | ParametricArrowFunction;

  public getParentGeneric(): ParametricClass | ParametricInterface | Method | ParametricMethod | Accessor | FamixFunction | ParametricFunction | ArrowFunction | ParametricArrowFunction {
    return this.parentGeneric;
  }

  public setParentGeneric(parentGeneric: ParametricClass | ParametricInterface | Method | ParametricMethod | Accessor | FamixFunction | ParametricFunction | ArrowFunction | ParametricArrowFunction): void {
    this.parentGeneric = parentGeneric;
    parentGeneric.addGenericParameter(this);
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
