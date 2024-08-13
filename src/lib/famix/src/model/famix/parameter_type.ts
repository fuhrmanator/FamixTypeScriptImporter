import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { ParametricClass } from "./parametric_class";
import { ParametricInterface } from "./parametric_interface";
import { Method } from "./method";
import { Function as FamixFunction } from "./function";
import { Accessor } from "./accessor";
import { ParametricMethod } from "./parametric_method";
import { ParametricFunction } from "./parametric_function";
import { ArrowFunction } from "./arrow_function";
import { ParametricArrowFunction } from "./parametric_arrow_function";

export class ParameterType extends Type {

    private _parentGeneric: ParametricClass | ParametricInterface | Method | ParametricMethod | Accessor | FamixFunction | ParametricFunction | ArrowFunction | ParametricArrowFunction;
    private _baseType: Type;
    private _arguments: Set<Type> = new Set();

    public addArgument(argument: Type): void {
        if (!this._arguments.has(argument)) {
            this._arguments.add(argument);
        }
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("ParameterType", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("parentGeneric", this.parentGeneric);
        exporter.addProperty("baseType", this.baseType);
        exporter.addProperty("arguments", this.arguments);
    }

    get parentGeneric() {
        return this._parentGeneric;
    }

    set parentGeneric(parentGeneric: ParametricClass | ParametricInterface | Method | ParametricMethod | Accessor | FamixFunction | ParametricFunction | ArrowFunction | ParametricArrowFunction) {
        this._parentGeneric = parentGeneric;
        parentGeneric.addGenericParameter(this);
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
}
