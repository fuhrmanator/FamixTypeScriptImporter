import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ScriptEntity } from "./script_entity";
import { ImportClause } from "./import_clause";

export class Module extends ScriptEntity {

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
