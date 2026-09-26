import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Interface } from "./interface";
import { TypeParameter } from "./type_parameter";

export class ParametricInterface extends Interface {

    private _typeParameters: Set<TypeParameter> = new Set();

    public addTypeParameter(typeParameter: TypeParameter): void {
        if (!this._typeParameters.has(typeParameter)) {
            this._typeParameters.add(typeParameter);
            typeParameter.genericEntity = this;
        }
    }

    public clearTypeParameters(): void {
        this._typeParameters.clear();
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("ParametricInterface", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("typeParameters", this._typeParameters);
    }

    get typeParameters(): Set<TypeParameter> {
        return this._typeParameters;
    }
}
