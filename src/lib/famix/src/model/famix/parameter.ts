import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { StructuralEntity } from "./structural_entity";
import { BehavioralEntity } from "./behavioral_entity";

export class Parameter extends StructuralEntity {

  private _parentEntity: BehavioralEntity;

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Parameter", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("parentBehaviouralEntity", this.parentEntity);
  }

    get parentEntity() {
        return this._parentEntity;
    }

    set parentEntity(parentEntity: BehavioralEntity) {
        this._parentEntity = parentEntity;
        parentEntity.addParameter(this);
    }
}
