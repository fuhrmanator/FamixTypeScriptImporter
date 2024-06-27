import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { ParametricClass } from "./parametric_class";

export class Concretisation extends Entity {

    private genericEntity: ParametricClass;

    public getGenericEntity(): ParametricClass {
      return this.genericEntity;
    }
  
    public setGenericEntity(genericEntity: ParametricClass): void {
      this.genericEntity = genericEntity;
    }
  
    private concreteEntity: ParametricClass;
  
    public getConcreteEntity(): ParametricClass {
      return this.concreteEntity;
    }
  
    public setConcreteEntity(concreteEntity: ParametricClass): void {
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