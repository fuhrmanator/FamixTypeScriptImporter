import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { ParametricClass } from "./parametric_class";
import { ParametricFunction } from "./parametric_function";
import { ParametricInterface } from "./parametric_interface";
import { ParametricMethod } from "./parametric_method";

export class Concretisation extends Entity {

    private _genericEntity!: ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod;
    private _concreteEntity!: ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod;  // is this correct?

    public getJSON(): string {
      const json: FamixJSONExporter = new FamixJSONExporter("Concretisation", this);
      this.addPropertiesToExporter(json);
      return json.getJSON();
    }
  
    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
      super.addPropertiesToExporter(exporter);
      exporter.addProperty("genericEntity", this.genericEntity);
      exporter.addProperty("concreteEntity", this.concreteEntity);
    }

    get genericEntity() {
        return this._genericEntity;
    }

    set genericEntity(genericEntity: ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod) {
        this._genericEntity = genericEntity;
    }

    get concreteEntity() {
        return this._concreteEntity;
    }

    set concreteEntity(concreteEntity: ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod) {
        this._concreteEntity = concreteEntity;
    }
}
