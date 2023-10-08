import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { StructuralEntity } from "./structural_entity";
import { BehavioralEntity } from "./behavioral_entity";

export class Parameter extends StructuralEntity {

  private parentEntity: BehavioralEntity;

  public getParentEntity(): BehavioralEntity {
    return this.parentEntity;
  }

  public setParentEntity(parentEntity: BehavioralEntity): void {
    this.parentEntity = parentEntity;
    parentEntity.addParameter(this);
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Parameter", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("parentEntity", this.getParentEntity());
  }
}
