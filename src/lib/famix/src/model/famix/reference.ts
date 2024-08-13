import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { ContainerEntity } from "./container_entity";
import { Entity } from "./entity";

export class Reference extends Entity {

    private _source: ContainerEntity;
    private _target: Type;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Reference", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("source", this.source);
        exporter.addProperty("target", this.target);
    }

    get source() {
        return this._source;
    }

    set source(source: ContainerEntity) {
        this._source = source;
        source.addOutgoingReference(this);
    }

    get target() {
        return this._target;
    }

    set target(target: Type) {
        this._target = target;
        target.addIncomingReference(this);
    }
}
