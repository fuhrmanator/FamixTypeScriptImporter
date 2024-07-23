import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Class } from "./class";
import { Interface } from "./interface";
import { ParameterType } from "./parameter_type";
import { PrimitiveType } from "./primitive_type";

export class ParametricInterface extends Interface {

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

  clearGenericParameters(): void {
    this.genericParameters.clear();
  }

  private concreteParameters: Set<PrimitiveType | Class | Interface> = new Set();

  public getConcreteParameters(): Set<PrimitiveType | Class | Interface> {
    return this.concreteParameters;
  }

  public addConcreteParameter(concreteParameter: PrimitiveType | Class | Interface): void {
    if (!this.concreteParameters.has(concreteParameter)) {
      this.concreteParameters.add(concreteParameter);
    }
  }

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ParametricInterface", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("genericParameters", this.getGenericParameters());
  }
}
