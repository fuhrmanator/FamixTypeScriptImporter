import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { BehavioralEntity } from "./behavioral_entity";

export class Function extends BehavioralEntity {

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Function", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
