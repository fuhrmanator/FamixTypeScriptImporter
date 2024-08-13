import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Class } from "./class";
import { Interface } from "./interface";
import { ParameterType } from "./parameter_type";
import { PrimitiveType } from "./primitive_type";

export class ParametricInterface extends Interface {

  private _genericParameters: Set<ParameterType> = new Set();

  public addGenericParameter(genericParameter: ParameterType): void {
    if (!this._genericParameters.has(genericParameter)) {
      this._genericParameters.add(genericParameter);
      genericParameter.setParentGeneric(this);
    }
  }

  clearGenericParameters(): void {
    this._genericParameters.clear();
  }

  private _concreteParameters: Set<PrimitiveType | Class | Interface> = new Set();

  public addConcreteParameter(concreteParameter: PrimitiveType | Class | Interface): void {
    if (!this._concreteParameters.has(concreteParameter)) {
      this._concreteParameters.add(concreteParameter);
    }
  }

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ParametricInterface", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("genericParameters", this.genericParameters);
    exporter.addProperty("concreteParameters", this.concreteParameters);
  }

    get genericParameters(): Set<ParameterType> {
        return this._genericParameters;
    }

    get concreteParameters(): Set<PrimitiveType | Class | Interface> {
        return this._concreteParameters;
    }
}
