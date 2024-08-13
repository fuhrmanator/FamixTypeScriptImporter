import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { EnumValue } from "./enum_value";

export class Enum extends Type {

  private values: Set<EnumValue> = new Set();

  public getValues(): Set<EnumValue> {
    return this.values;
  }

  public addValue(value: EnumValue): void {
    if (!this.values.has(value)) {
      this.values.add(value);
      value.parentEntity = this;
    }
  }
  

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Enum", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("enumValues", this.getValues());
  }
}
