import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Variable } from "./variable";

export class ImplicitVariable extends Variable {

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ImplicitVariable", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
