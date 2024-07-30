import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Class } from "./class";
import { Interface } from "./interface";
import { StructuralEntity } from "./structural_entity";

export type VisibilityTypes = "public" | "private" | "protected" | "";

export class Property extends StructuralEntity {

  private isClassSide: boolean = false;

  /**
   * Getter $readOnly
   * @return {boolean}
   */
  public get readOnly(): boolean {
    return this._readOnly;
  }

  /**
   * Setter $readOnly
   * @param {boolean} value
   */
  public set readOnly(value: boolean) {
    this._readOnly = value;
  }
  private _readOnly: boolean;

  public getIsClassSide(): boolean {
    return this.isClassSide;
  }

  public setIsClassSide(isClassSide: boolean): void {
    this.isClassSide = isClassSide;
  }

  private parentEntity: Class | Interface;

  public getParentEntity(): Class | Interface {
    return this.parentEntity;
  }

  public setParentEntity(parentEntity: Class | Interface): void {
    this.parentEntity = parentEntity;
    parentEntity.addProperty(this);
  }

  private modifiers: Set<string> = new Set();

  public getModifiers(): Set<string> {
    return this.modifiers;
  }

  public addModifier(modifier: string): void {
    if (!this.modifiers.has(modifier)) {
      this.modifiers.add(modifier);
    }
  }


  /**
   * Getter visibility
   * @return {VisibilityTypes }
   */
  public get visibility(): VisibilityTypes {
    return this._visibility;
  }

  /**
   * Setter visibility
   * @param {VisibilityTypes } value
   */
  public set visibility(value: VisibilityTypes) {
    this._visibility = value;
  }

  private _visibility: VisibilityTypes = "";

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Property", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("readOnly", this.readOnly);
    exporter.addProperty("isClassSide", this.getIsClassSide());
    exporter.addProperty("parentBehaviouralEntity", this.getParentEntity());
    exporter.addProperty("modifiers", this.getModifiers());
  }
}
