import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { StructuralEntity } from "./structural_entity";
import { Association } from "./association";
import { ContainerEntity } from "./container_entity";

export class Access extends Association {

  private accessor: ContainerEntity;

  public getAccessor(): ContainerEntity {
    return this.accessor;
  }

  public setAccessor(accessor: ContainerEntity): void {
    this.accessor = accessor;
    accessor.addAccess(this);
  }

  private variable: StructuralEntity;

  public getVariable(): StructuralEntity {
    return this.variable;
  }

  public setVariable(variable: StructuralEntity): void {
    this.variable = variable;
    variable.addIncomingAccess(this);
  }

  private isWrite: boolean;

  public getIsWrite(): boolean {
    return this.isWrite;
  }

  public setIsWrite(isWrite: boolean): void {
    this.isWrite = isWrite;
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Access", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("accessor", this.getAccessor());
    exporter.addProperty("variable", this.getVariable());
    exporter.addProperty("isWrite", this.getIsWrite());
  }
}
