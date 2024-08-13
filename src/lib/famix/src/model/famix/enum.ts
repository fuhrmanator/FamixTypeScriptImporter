import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { EnumValue } from "./enum_value";

export class Enum extends Type {

    private _values: Set<EnumValue> = new Set();

    public addValue(value: EnumValue): void {
        if (!this._values.has(value)) {
            this._values.add(value);
            value.parentEntity = this;
        }
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Enum", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("enumValues", this.values);
    }

    get values() {
        return this._values;
    }
}
