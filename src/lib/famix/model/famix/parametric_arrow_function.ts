import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ArrowFunction } from "./arrow_function";
import { Class } from "./class";
import { Interface } from "./interface";
import { PrimitiveType } from "./primitive_type";

export class ParametricArrowFunction extends ArrowFunction {

    private _concreteParameters: Set<PrimitiveType | Class | Interface> = new Set();

    public addConcreteParameter(concreteParameter: PrimitiveType | Class | Interface): void {
        if (!this._concreteParameters.has(concreteParameter)) {
            this._concreteParameters.add(concreteParameter);
        }
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("ParametricArrowFunction", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("genericParameters", this.genericParameters);
        exporter.addProperty("concreteParameters", this.concreteParameters);
    }

    get concreteParameters() {
        return this._concreteParameters;
    }
}