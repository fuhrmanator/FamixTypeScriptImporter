import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { NamedEntity } from "./named_entity";
import { Type } from "./type";

export class Alias extends NamedEntity {

  private parentEntity: NamedEntity;

  public getParentEntity(): NamedEntity {
    return this.parentEntity;
  }

  public setParentEntity(parentEntity: NamedEntity): void {
    this.parentEntity = parentEntity;
    parentEntity.addAlias(this);
  }

  private aliasedEntity: Type;

  public getAliasedEntity(): Type {
    return this.aliasedEntity;
  }

  public setAliasedEntity(aliasedEntity: Type): void {
    this.aliasedEntity = aliasedEntity;
    aliasedEntity.addTypeAlias(this);
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Alias", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("parentType", this.getParentEntity());
    exporter.addProperty("aliasedEntity", this.getAliasedEntity());
  }
}
