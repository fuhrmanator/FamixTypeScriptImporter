import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Concretisation } from "./concretisation";
import { Entity } from "./entity";
import { ParameterType } from "./parameter_type";
import { PrimitiveType } from "./primitive_type";

export class ParameterConcretisation extends Entity {

    private _genericParameter!: ParameterType;
    private _concreteParameter!: PrimitiveType;
    private _concretisations: Set<Concretisation> = new Set();

    public addConcretisation(concretisation: Concretisation): void {
      if (!this._concretisations.has(concretisation)) {
        this._concretisations.add(concretisation);
      }
    }
  
    public getJSON(): string {
      const json: FamixJSONExporter = new FamixJSONExporter("ParameterConcretisation", this);
      this.addPropertiesToExporter(json);
      return json.getJSON();
    }
  
    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
      super.addPropertiesToExporter(exporter);
      exporter.addProperty("genericEntity", this.genericParameter);
      exporter.addProperty("concreteEntity", this.concreteParameter);
      exporter.addProperty("concretisations", this.concretisations);
    }

    get genericParameter() {
        return this._genericParameter;
    }

    set genericParameter(genericEntity: ParameterType) {
        this._genericParameter = genericEntity;
    }

    get concreteParameter() {
        return this._concreteParameter;
    }

    set concreteParameter(concreteParameter: PrimitiveType) {
        this._concreteParameter = concreteParameter;
    }

    get concretisations() {
        return this._concretisations;
    }
}
