import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Class } from "./class";
import { ParameterType } from "./parameter_type";
import { PrimitiveType } from "./primitive_type";

export class ParametricClass extends Class {

  private genericParameters: Set<ParameterType> = new Set();

  public getGenericParameters(): Set<ParameterType> {
    return this.genericParameters;
  }

  public addGenericParameter(genericParameter: ParameterType): void {
    if (!this.genericParameters.has(genericParameter)) {
      this.genericParameters.add(genericParameter);
      genericParameter.setParentGeneric(this);
    }
  }

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
    const json: FamixJSONExporter = new FamixJSONExporter("ParametricClass", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("genericParameters", this.getGenericParameters());
    exporter.addProperty("concreteParameters", this.getConcreteParameters());

  }
}
