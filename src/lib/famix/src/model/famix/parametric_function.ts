import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Function } from "./function";

export class ParametricFunction extends Function {

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ParametricFunction", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
