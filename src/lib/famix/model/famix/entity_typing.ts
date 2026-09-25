import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { BehavioralEntity } from "./behavioral_entity";
import { Entity } from "./entity";
import { StructuralEntity } from "./structural_entity";
import { Type } from "./type";

type TypedEntity = StructuralEntity | BehavioralEntity;

export class EntityTyping extends Entity {

    private _typedEntity!: TypedEntity;
    private _declaredType!: Type;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("EntityTyping", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("typedEntity", this.typedEntity);
        exporter.addProperty("declaredType", this.declaredType);
    }

    get typedEntity() {
        return this._typedEntity;
    }

    set typedEntity(typedEntity: TypedEntity) {
        this._typedEntity = typedEntity;
    }

    get declaredType() {
        return this._declaredType;
    }

    set declaredType(declaredType: Type) {
        this._declaredType = declaredType;
    }
}
