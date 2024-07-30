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


    /**
     * Getter $isClassSide
     * @return {boolean }
     */
	public get $isClassSide(): boolean  {
		return this.isClassSide;
	}

    /**
     * Setter $isClassSide
     * @param {boolean } value
     */
	public set $isClassSide(value: boolean ) {
		this.isClassSide = value;
	}

    /**
     * Getter isDefinitelyAssigned
     * @return {boolean}
     */
	public get isDefinitelyAssigned(): boolean {
		return this._isDefinitelyAssigned;
	}

    /**
     * Setter isDefinitelyAssigned
     * @param {boolean} value
     */
	public set isDefinitelyAssigned(value: boolean) {
		this._isDefinitelyAssigned = value;
	}

    /**
     * Getter isOptional
     * @return {boolean}
     */
	public get isOptional(): boolean {
		return this._isOptional;
	}

    /**
     * Setter isOptional
     * @param {boolean} value
     */
	public set isOptional(value: boolean) {
		this._isOptional = value;
	}

    /**
     * Getter isJavaScriptPrivate
     * @return {boolean}
     */
	public get isJavaScriptPrivate(): boolean {
		return this._isJavaScriptPrivate;
	}

    /**
     * Setter isJavaScriptPrivate
     * @param {boolean} value
     */
	public set isJavaScriptPrivate(value: boolean) {
		this._isJavaScriptPrivate = value;
	}
  private _isDefinitelyAssigned: boolean;

  private _isOptional: boolean;

  private _isJavaScriptPrivate: boolean;

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
    exporter.addProperty("parentType", this.getParentEntity());
    exporter.addProperty("visibility", this.visibility);
    exporter.addProperty("isDefinitelyAssigned", this.isDefinitelyAssigned);
    exporter.addProperty("isOptional", this.isOptional);
    exporter.addProperty("isJavaScriptPrivate", this.isJavaScriptPrivate);
  }
}
