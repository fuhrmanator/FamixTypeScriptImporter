import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Concretization } from "./concretization";
import { Invocation } from "./invocation";

export class ParametricInvocation extends Invocation {
    private _concretizations: Set<Concretization> = new Set();

    public addConcretization(concretization: Concretization): void {
        if (!this._concretizations.has(concretization)) {
            this._concretizations.add(concretization);
            concretization.triggeringAssociation = this;
        }
    }

    public get concretizations() {
        return this._concretizations;
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("ParametricInvocation", this);

        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);

        exporter.addProperty("concretizations", this.concretizations);
    }
}