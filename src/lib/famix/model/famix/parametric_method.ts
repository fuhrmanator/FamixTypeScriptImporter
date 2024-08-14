import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Class } from "./class";
import { Interface } from "./interface";
import { Method } from "./method";
import { PrimitiveType } from "./primitive_type";

export class ParametricMethod extends Method {

    private _concreteParameters: Set<PrimitiveType | Class | Interface> = new Set();

    public addConcreteParameter(concreteParameter: PrimitiveType | Class | Interface): void {
        if (!this._concreteParameters.has(concreteParameter)) {
            this._concreteParameters.add(concreteParameter);
        }
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("ParametricMethod", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("genericParameters", this.genericParameters);
        exporter.addProperty("concreteParameters", this.concreteParameters);
    }

    get concreteParameters(): Set<PrimitiveType | Class | Interface> {
        return this._concreteParameters;
    }
}
