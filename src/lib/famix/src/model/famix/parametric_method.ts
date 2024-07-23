import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Class } from "./class";
import { Interface } from "./interface";
import { Method } from "./method";
import { PrimitiveType } from "./primitive_type";

export class ParametricMethod extends Method {
  
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
    const json: FamixJSONExporter = new FamixJSONExporter("ParametricMethod", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
