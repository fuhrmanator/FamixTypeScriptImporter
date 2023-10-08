import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";

export class ParameterizedType extends Type {

  private baseType: Type;

  public getBaseType(): Type {
    return this.baseType;
  }

  public setBaseType(baseType: Type): void {
    this.baseType = baseType;
  }

  private arguments: Set<Type> = new Set();

  public getArguments(): Set<Type> {
    return this.arguments;
  }

  public addArgument(argument: Type): void {
    if (!this.arguments.has(argument)) {
      this.arguments.add(argument);
    }
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ParameterizedType", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("baseType", this.getBaseType());
    exporter.addProperty("arguments", this.getArguments());
  }
}
