import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";

export class PrimitiveType extends Type {

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("PrimitiveType", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
    }
}
