import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Concretization } from "./concretization";
import { EntityTyping } from "./entity_typing";
import { Entity } from "./entity";
import { Type } from "./type";

export class ParametricEntityTyping extends EntityTyping {

    private _concretizations: Set<Concretization> = new Set();

    public addConcretization(concretization: Concretization): void {
        if (!this._concretizations.has(concretization)) {
            this._concretizations.add(concretization);
            concretization.triggeringAssociation = this;
        }
    }

    public get concretizations(): Set<Concretization> {
        return this._concretizations;
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("ParametricEntityTyping", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("concretizations", this.concretizations);
    }
}
