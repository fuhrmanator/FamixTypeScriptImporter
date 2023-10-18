import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Interface } from "./interface";
import { ParameterType } from "./parameter_type";

export class ParameterizableInterface extends Interface {

  private parameterTypes: Set<ParameterType> = new Set();

  public getParameterTypes(): Set<ParameterType> {
    return this.parameterTypes;
  }

  public addParameterType(parameterType: ParameterType): void {
    if (!this.parameterTypes.has(parameterType)) {
      this.parameterTypes.add(parameterType);
      parameterType.setParentGeneric(this);
    }
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ParameterizableInterface", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("parameterTypes", this.getParameterTypes());
  }
}
