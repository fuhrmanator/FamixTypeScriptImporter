import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ImportClause } from "./import_clause";
import { ScopingEntity } from "./scoping_entity";
import { ScriptEntity } from "./script_entity";

export class Module extends ScriptEntity {

    /**
     * Getter $isAmbient
     * @return {boolean }
     */
    public get isAmbient() {
        return this._isAmbient;
    }

    /**
     * Setter $isAmbient
     * @param {boolean } value
     */
    public set isAmbient(value: boolean) {
        this._isAmbient = value;
    }

    private _isAmbient: boolean = false;

    /**
     * Getter $isNamespace
     * @return {boolean }
     */
    public get isNamespace() {
        return this._isNamespace;
    }

    /**
     * Setter $isNamespace
     * @param {boolean } value
     */
    public set isNamespace(value: boolean) {
        this._isNamespace = value;
    }
    private _isNamespace: boolean = false;

    /**
     * Getter $isModule
     * @return {boolean }
     */
    public get isModule() {
        return this._isModule;
    }

    /**
     * Setter $isModule
     * @param {boolean } value
     */
    public set isModule(value: boolean) {
        this._isModule = value;
    }

    private _isModule: boolean = true;

    private _parentScope: ScopingEntity;
    // incomingImports are in NamedEntity
    private _outgoingImports: Set<ImportClause> = new Set();

    addOutgoingImport(importClause: ImportClause) {
        if (!this._outgoingImports.has(importClause)) {
            this._outgoingImports.add(importClause);
            importClause.importingEntity = this;  // opposite
        }
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Module", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("outgoingImports", this.outgoingImports);
    }

    get parentScope() {
        return this._parentScope;
    }

    set parentScope(parentScope: ScopingEntity) {
        this._parentScope = parentScope;
        parentScope.addModule(this);
    }

    get outgoingImports() {
        return this._outgoingImports;
    }
}
