import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { SourcedEntity } from "./sourced_entity";

export class SourceLanguage extends Entity {

  private sourcedEntities: Set<SourcedEntity> = new Set();

  // name of the source language
  get name(): string {
    return "TypeScript";
  }

  public getSourcedEntities(): Set<SourcedEntity> {
    return this.sourcedEntities;
  }

  public addSourcedEntity(sourcedEntity: SourcedEntity): void {
    if (!this.sourcedEntities.has(sourcedEntity)) {
      this.sourcedEntities.add(sourcedEntity);
      sourcedEntity.setDeclaredSourceLanguage(this);
    }
  }


  public getJSON(): string {
    const mse: FamixJSONExporter = new FamixJSONExporter("SourceLanguage", this);
    this.addPropertiesToExporter(mse);
    return mse.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("name", this.name);
    exporter.addProperty("sourcedEntities", this.getSourcedEntities());
  }
}
