import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ImportClause } from "./import_clause";
import { ScopingEntity } from "./scoping_entity";
import { ScriptEntity } from "./script_entity";

export class Module extends ScriptEntity {


    /**
     * Getter $isAmbient
     * @return {boolean }
     */
	public get $isAmbient(): boolean  {
		return this.isAmbient;
	}

    /**
     * Setter $isAmbient
     * @param {boolean } value
     */
	public set $isAmbient(value: boolean ) {
		this.isAmbient = value;
	}

  private isAmbient: boolean = false;

    /**
     * Getter $isNamespace
     * @return {boolean }
     */
	public get $isNamespace(): boolean  {
		return this.isNamespace;
	}

    /**
     * Setter $isNamespace
     * @param {boolean } value
     */
	public set $isNamespace(value: boolean ) {
		this.isNamespace = value;
	}
  private isNamespace: boolean = false;

    /**
     * Getter $isModule
     * @return {boolean }
     */
	public get $isModule(): boolean  {
		return this.isModule;
	}

    /**
     * Setter $isModule
     * @param {boolean } value
     */
	public set $isModule(value: boolean ) {
		this.isModule = value;
	}
  
  private isModule: boolean = true;

  private parentScope: ScopingEntity;

  public getParentScope(): ScopingEntity {
    return this.parentScope;
  }

  public setParentScope(parentScope: ScopingEntity): void {
    this.parentScope = parentScope;
    parentScope.addModule(this);
  }

  // incomingImports are in NamedEntity
  private outgoingImports: Set<ImportClause> = new Set();
  
  getOutgoingImports() {
    return this.outgoingImports;
  }

  addOutgoingImport(importClause: ImportClause) {
    if (!this.outgoingImports.has(importClause)) {
      this.outgoingImports.add(importClause);
      importClause.setImportingEntity(this);  // opposite
    }
  }

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Module", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("outgoingImports", this.getOutgoingImports());
  }
}
