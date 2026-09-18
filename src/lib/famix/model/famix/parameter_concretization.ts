import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Concretization } from "./concretization";
import { Entity } from "./entity";
import { TypeParameter } from "./type_parameter";
import { PrimitiveType } from "./primitive_type";

export class ParameterConcretization extends Entity {

    private _genericParameter!: TypeParameter;
    private _concreteParameter!: PrimitiveType;
    private _concretizations: Set<Concretization> = new Set();

    public addConcretization(concretization: Concretization): void {
      if (!this._concretizations.has(concretization)) {
        this._concretizations.add(concretization);
      }
    }
  
    public getJSON(): string {
      const json: FamixJSONExporter = new FamixJSONExporter("ParameterConcretization", this);
      this.addPropertiesToExporter(json);
      return json.getJSON();
    }
  
    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
      super.addPropertiesToExporter(exporter);
      exporter.addProperty("genericEntity", this.genericParameter);
      exporter.addProperty("concreteEntity", this.concreteParameter);
      exporter.addProperty("concretizations", this.concretizations);
    }

    get genericParameter() {
        return this._genericParameter;
    }

    set genericParameter(genericEntity: TypeParameter) {
        this._genericParameter = genericEntity;
    }

    get concreteParameter() {
        return this._concreteParameter;
    }

    set concreteParameter(concreteParameter: PrimitiveType) {
        this._concreteParameter = concreteParameter;
    }

    get concretizations() {
        return this._concretizations;
    }
}
