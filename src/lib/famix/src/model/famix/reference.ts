import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { Association } from "./association";
import { ContainerEntity } from "./container_entity";

export class Reference extends Association {

  private source: ContainerEntity;

  public getSource(): ContainerEntity {
    return this.source;
  }

  public setSource(source: ContainerEntity): void {
    this.source = source;
    source.addOutgoingReference(this);
  }

  private target: Type;

  public getTarget(): Type {
    return this.target;
  }

  public setTarget(target: Type): void {
    this.target = target;
    target.addIncomingReference(this);
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Reference", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("source", this.getSource());
    exporter.addProperty("target", this.getTarget());
  }
}
