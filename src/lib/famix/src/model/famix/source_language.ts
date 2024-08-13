import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { SourcedEntity } from "./sourced_entity";

export class SourceLanguage extends Entity {

    private _sourcedEntities: Set<SourcedEntity> = new Set();

    // name of the source language
    get name(): string {
        return "TypeScript";
    }

    public addSourcedEntity(sourcedEntity: SourcedEntity): void {
        if (!this._sourcedEntities.has(sourcedEntity)) {
            this._sourcedEntities.add(sourcedEntity);
            sourcedEntity.setDeclaredSourceLanguage(this);
        }
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("SourceLanguage", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("sourcedEntities", this.sourcedEntities);
    }

    get sourcedEntities() {
        return this._sourcedEntities;
    }
}
