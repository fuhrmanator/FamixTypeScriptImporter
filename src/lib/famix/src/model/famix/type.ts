import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { StructuralEntity } from "./structural_entity";
import { ContainerEntity } from "./container_entity";
import { Reference } from "./reference";
import { BehavioralEntity } from "./behavioral_entity";
import { Alias } from "./alias";

export class Type extends ContainerEntity {

  private container: ContainerEntity;

  public getContainer(): ContainerEntity {
    return this.container;
  }

  public setContainer(container: ContainerEntity): void {
    this.container = container;
    container.addType(this);
  }

  private typeAliases: Set<Alias> = new Set();

  public getTypeAliases(): Set<Alias> {
    return this.typeAliases;
  }

  public addTypeAlias(typeAlias: Alias): void {
    if (!this.typeAliases.has(typeAlias)) {
      this.typeAliases.add(typeAlias);
      typeAlias.aliasedEntity = this;
    }
  }

  private structuresWithDeclaredType: Set<StructuralEntity> = new Set();

  public getStructuresWithDeclaredType(): Set<StructuralEntity> {
    return this.structuresWithDeclaredType;
  }

  public addStructureWithDeclaredType(structureWithDeclaredType: StructuralEntity): void {
    if (!this.structuresWithDeclaredType.has(structureWithDeclaredType)) {
      this.structuresWithDeclaredType.add(structureWithDeclaredType);
      structureWithDeclaredType.setDeclaredType(this);
    }
  }

  private behavioralEntitiesWithDeclaredType: Set<BehavioralEntity> = new Set();

  public getBehavioralEntitiesWithDeclaredType(): Set<BehavioralEntity> {
    return this.behavioralEntitiesWithDeclaredType;
  }

  public addBehavioralEntityWithDeclaredType(behavioralEntityWithDeclaredType: BehavioralEntity): void {
    if (!this.behavioralEntitiesWithDeclaredType.has(behavioralEntityWithDeclaredType)) {
      this.behavioralEntitiesWithDeclaredType.add(behavioralEntityWithDeclaredType);
      behavioralEntityWithDeclaredType.declaredType = this;
    }
  }

  private incomingReferences: Set<Reference> = new Set();

  public getIncomingReferences(): Set<Reference> {
    return this.incomingReferences;
  }

  public addIncomingReference(incomingReference: Reference): void {
    if (!this.incomingReferences.has(incomingReference)) {
      this.incomingReferences.add(incomingReference);
      incomingReference.target = this;
    }
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Type", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("typeContainer", this.getContainer());
    /* unsupported properties in MM so far */
    // exporter.addProperty("typeAliases", this.getTypeAliases());
    // exporter.addProperty("structuresWithDeclaredType", this.getStructuresWithDeclaredType());
    // exporter.addProperty("behavioralEntitiesWithDeclaredType", this.getBehavioralEntitiesWithDeclaredType());
    exporter.addProperty("incomingReferences", this.getIncomingReferences());
  }
}
