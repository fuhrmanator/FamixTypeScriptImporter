import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { Access } from "./access";
import { NamedEntity } from "./named_entity";

export class StructuralEntity extends NamedEntity {

  private incomingAccesses: Set<Access> = new Set();

  public getIncomingAccesses(): Set<Access> {
    return this.incomingAccesses;
  }

  public addIncomingAccess(incomingAccess: Access): void {
    if (!this.incomingAccesses.has(incomingAccess)) {
      this.incomingAccesses.add(incomingAccess);
      incomingAccess.variable = this;
    }
  }

  private declaredType: Type;

  public getDeclaredType(): Type {
    return this.declaredType;
  }

  public setDeclaredType(declaredType: Type): void {
    this.declaredType = declaredType;
    declaredType.addStructureWithDeclaredType(this);
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("StructuralEntity", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("incomingAccesses", this.getIncomingAccesses());
    exporter.addProperty("declaredType", this.getDeclaredType());
  }
}
