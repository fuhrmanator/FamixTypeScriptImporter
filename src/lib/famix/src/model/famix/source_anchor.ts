import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { SourcedEntity } from "./sourced_entity";

export class SourceAnchor extends Entity {

  private element: SourcedEntity;

  public getElement(): SourcedEntity {
    return this.element;
  }

  public setElement(element: SourcedEntity): void {
    if (this.element === undefined) {
      this.element = element;
      element.setSourceAnchor(this);
    }
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("SourceAnchor", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("element", this.getElement());
  }
}
