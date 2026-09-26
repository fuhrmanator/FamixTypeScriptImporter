import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { ParametricClass } from "./parametric_class";
import { ParametricInterface } from "./parametric_interface";
import { ParametricMethod } from "./parametric_method";
import { ParametricFunction } from "./parametric_function";
import { ParametricArrowFunction } from "./parametric_arrow_function";
import { Concretization } from "./concretization";

export class TypeParameter extends Type {

    private _genericEntity!: ParametricClass | ParametricInterface | ParametricMethod | ParametricFunction | ParametricArrowFunction;
    private _baseType!: Type;
    private _arguments: Set<Type> = new Set();
    private _concretizations: Set<Concretization> = new Set();

    public addArgument(argument: Type): void {
        if (!this._arguments.has(argument)) {
            this._arguments.add(argument);
        }
    }

    public addConcretization(concretization: Concretization): void {
        if (!this._concretizations.has(concretization)) {
            this._concretizations.add(concretization);
        }
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("TypeParameter", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("genericEntity", this.genericEntity);
        exporter.addProperty("baseType", this.baseType);
        exporter.addProperty("arguments", this.arguments);
        exporter.addProperty("concretizations", this.concretizations);
    }

    get genericEntity() {
        return this._genericEntity;
    }

    set genericEntity(genericEntity: ParametricClass | ParametricInterface | ParametricMethod | ParametricFunction | ParametricArrowFunction) {
        this._genericEntity = genericEntity;
        genericEntity.addTypeParameter(this);
    }

    get baseType() {
        return this._baseType;
    }

    set baseType(baseType: Type) {
        this._baseType = baseType;
    }

    get arguments() {
        return this._arguments;
    }

    get concretizations() {
        return this._concretizations;
    }
}
