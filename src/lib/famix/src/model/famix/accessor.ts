import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Method } from "./method";

export class Accessor extends Method {
  
  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Accessor", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
