import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { BehavioralEntity } from "./behavioral_entity";
import { Class } from "./class";
import { Interface } from "./interface";

export class Method extends BehavioralEntity {

  private _parentEntity!: Class | Interface;
  private _kind!: string;
  private _isAbstract!: boolean;
  private _isClassSide!: boolean;
  private _isPrivate!: boolean;
  private _isPublic!: boolean;
  private _isProtected!: boolean;

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Method", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("parentType", this.parentEntity);
    exporter.addProperty("kind", this.kind);
    exporter.addProperty("isAbstract", this.isAbstract);
    exporter.addProperty("isClassSide", this.isClassSide);
    exporter.addProperty("isPrivate", this.isPrivate);
    exporter.addProperty("isPublic", this.isPublic);
    exporter.addProperty("isProtected", this.isProtected);
  }

    get parentEntity() {
        return this._parentEntity;
    }

    set parentEntity(parentEntity: Class | Interface) {
        this._parentEntity = parentEntity;
        parentEntity.addMethod(this);
    }

    get kind() {
        return this._kind;
    }

    set kind(kind: string) {
        this._kind = kind;
    }

    get isAbstract() {
        return this._isAbstract;
    }

    set isAbstract(isAbstract: boolean) {
        this._isAbstract = isAbstract;
    }

    get isClassSide() {
        return this._isClassSide;
    }

    set isClassSide(isClassSide: boolean) {
        this._isClassSide = isClassSide;
    }

    get isPrivate() {
        return this._isPrivate;
    }

    set isPrivate(isPrivate: boolean) {
        this._isPrivate = isPrivate;
    }

    get isPublic() {
        return this._isPublic;
    }

    set isPublic(isPublic: boolean) {
        this._isPublic = isPublic;
    }

    get isProtected() {
        return this._isProtected;
    }

    set isProtected(isProtected: boolean) {
        this._isProtected = isProtected;
    }
}
