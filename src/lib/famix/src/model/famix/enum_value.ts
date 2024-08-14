import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { StructuralEntity } from "./structural_entity";
import { Enum } from "./enum";

export class EnumValue extends StructuralEntity {

    private _parentEntity!: Enum;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("EnumValue", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("parentEnum", this.parentEntity);
    }

    get parentEntity(): Enum {
        return this._parentEntity;
    }

    set parentEntity(parentEntity: Enum) {
        this._parentEntity = parentEntity;
        parentEntity.addValue(this);
    }
}
