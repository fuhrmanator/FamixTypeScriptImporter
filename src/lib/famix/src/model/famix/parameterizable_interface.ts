import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Interface } from "./interface";
import { TypeParameter } from "./type_parameter";

export class ParameterizableInterface extends Interface {

  private typeParameters: Set<TypeParameter> = new Set();

  public getTypeParameters(): Set<TypeParameter> {
    return this.typeParameters;
  }

  public addTypeParameter(typeParameter: TypeParameter): void {
    if (!this.typeParameters.has(typeParameter)) {
      this.typeParameters.add(typeParameter);
      typeParameter.setParentGeneric(this);
    }
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ParameterizableInterface", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("typeParameters", this.getTypeParameters());
  }
}
