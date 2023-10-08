import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { FamixBaseElement } from "../../famix_base_element";

export class Entity extends FamixBaseElement {

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Entity", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
