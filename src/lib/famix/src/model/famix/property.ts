import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Class } from "./class";
import { Interface } from "./interface";
import { StructuralEntity } from "./structural_entity";

export type VisibilityTypes = "public" | "private" | "protected" | "";

export class Property extends StructuralEntity {

    private _isClassSide: boolean = false;

    public get readOnly() {
        return this._readOnly;
    }

    public set readOnly(value: boolean) {
        this._readOnly = value;
    }
    private _readOnly: boolean;
    private _parentEntity: Class | Interface;

    public get isDefinitelyAssigned() {
        return this._isDefinitelyAssigned;
    }

    public set isDefinitelyAssigned(value: boolean) {
        this._isDefinitelyAssigned = value;
    }

    public get isOptional() {
        return this._isOptional;
    }

    public set isOptional(value: boolean) {
        this._isOptional = value;
    }

    public get isJavaScriptPrivate() {
        return this._isJavaScriptPrivate;
    }

    public set isJavaScriptPrivate(value: boolean) {
        this._isJavaScriptPrivate = value;
    }
    private _isDefinitelyAssigned: boolean;

    private _isOptional: boolean;

    private _isJavaScriptPrivate: boolean;

    public get visibility() {
        return this._visibility;
    }

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
        exporter.addProperty("isClassSide", this.isClassSide);
        exporter.addProperty("parentType", this.parentEntity);
        exporter.addProperty("visibility", this.visibility);
        exporter.addProperty("isDefinitelyAssigned", this.isDefinitelyAssigned);
        exporter.addProperty("isOptional", this.isOptional);
        exporter.addProperty("isJavaScriptPrivate", this.isJavaScriptPrivate);
    }

    get isClassSide() {
        return this._isClassSide;
    }

    set isClassSide(isClassSide: boolean) {
        this._isClassSide = isClassSide;
    }

    get parentEntity() {
        return this._parentEntity;
    }

    set parentEntity(parentEntity: Class | Interface) {
        this._parentEntity = parentEntity;
        parentEntity.addProperty(this);
    }
}
