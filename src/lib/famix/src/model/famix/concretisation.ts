import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { ParametricClass } from "./parametric_class";
import { ParametricFunction } from "./parametric_function";
import { ParametricInterface } from "./parametric_interface";
import { ParametricMethod } from "./parametric_method";

export class Concretisation extends Entity {

    private genericEntity: ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod;

    public getGenericEntity(): ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod {
      return this.genericEntity;
    }
  
    public setGenericEntity(genericEntity: ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod): void {
      this.genericEntity = genericEntity;
    }
  
    private concreteEntity: ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod;
  
    public getConcreteEntity(): ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod {
      return this.concreteEntity;
    }
  
    public setConcreteEntity(concreteEntity: ParametricClass | ParametricInterface | ParametricFunction | ParametricMethod): void {
      this.concreteEntity = concreteEntity;
    }
  
    public getJSON(): string {
      const json: FamixJSONExporter = new FamixJSONExporter("Concretisation", this);
      this.addPropertiesToExporter(json);
      return json.getJSON();
    }
  
    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
      super.addPropertiesToExporter(exporter);
      exporter.addProperty("genericEntity", this.getGenericEntity());
      exporter.addProperty("concreteEntity", this.getConcreteEntity());
    }

}