import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { ParametricClass } from "./parametric_class";
import { ParametricInterface } from "./parametric_interface";

export class Concretisation extends Entity {

    private genericEntity: ParametricClass | ParametricInterface;

    public getGenericEntity(): ParametricClass | ParametricInterface {
      return this.genericEntity;
    }
  
    public setGenericEntity(genericEntity: ParametricClass | ParametricInterface): void {
      this.genericEntity = genericEntity;
    }
  
    private concreteEntity: ParametricClass | ParametricInterface;
  
    public getConcreteEntity(): ParametricClass | ParametricInterface {
      return this.concreteEntity;
    }
  
    public setConcreteEntity(concreteEntity: ParametricClass | ParametricInterface): void {
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