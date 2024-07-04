import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { ParameterType } from "./parameter_type";
import { PrimitiveType } from "./primitive_type";

export class ParameterConcretisation extends Entity {

    private genericParameter: ParameterType;

    public getGenericParameter(): ParameterType {
      return this.genericParameter;
    }
  
    public setGenericParameter(genericEntity: ParameterType): void {
      this.genericParameter = genericEntity;
    }
  
    private concreteParameter: PrimitiveType;
  
    public getConcreteParameter(): PrimitiveType {
      return this.concreteParameter;
    }
  
    public setConcreteParameter(concreteParameter: PrimitiveType): void {
      this.concreteParameter = concreteParameter;
    }
  
    public getJSON(): string {
      const json: FamixJSONExporter = new FamixJSONExporter("ParameterConcretisation", this);
      this.addPropertiesToExporter(json);
      return json.getJSON();
    }
  
    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
      super.addPropertiesToExporter(exporter);
      exporter.addProperty("genericEntity", this.getGenericParameter());
      exporter.addProperty("concreteEntity", this.getConcreteParameter());
    }

}