import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { SourceLanguage } from "./source_language";

export class CSourceLanguage extends SourceLanguage {

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("CSourceLanguage", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
