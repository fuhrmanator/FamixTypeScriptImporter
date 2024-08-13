import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { NamedEntity } from "./named_entity";
import { Type } from "./type";

export class Alias extends NamedEntity {

    private _parentEntity: NamedEntity;
    private _aliasedEntity: Type;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Alias", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("parentType", this.parentEntity);
        exporter.addProperty("aliasedEntity", this.aliasedEntity);
    }

    get parentEntity(): NamedEntity {
        return this._parentEntity;
    }

    set parentEntity(parentEntity: NamedEntity) {
        this._parentEntity = parentEntity;
        parentEntity.addAlias(this);
    }

    get aliasedEntity(): Type {
        return this._aliasedEntity;
    }

    set aliasedEntity(aliasedEntity: Type) {
        this._aliasedEntity = aliasedEntity;
        aliasedEntity.addTypeAlias(this);
    }
}
