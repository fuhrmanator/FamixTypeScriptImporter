import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Function } from "./function";
import { PrimitiveType } from "./primitive_type";

export class ParametricFunction extends Function {

  private concreteParameters: Set<PrimitiveType> = new Set();

  public getConcreteParameters(): Set<PrimitiveType> {
    return this.concreteParameters;
  }

  public addConcreteParameter(concreteParameter: PrimitiveType): void {
    if (!this.concreteParameters.has(concreteParameter)) {
      this.concreteParameters.add(concreteParameter);
    }
  }

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ParametricFunction", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
