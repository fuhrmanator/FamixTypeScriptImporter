import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ContainerEntity } from "./container_entity";
// import { Namespace } from "./namespace";
import { logger } from "../../../../../analyze";
import { Module } from "./module";

export class ScopingEntity extends ContainerEntity {

  private childModules: Set<Module> = new Set();

  public getModules(): Set<Module> {
    return this.childModules;
  }

  public addModule(childModule: Module): void {
    if (!this.childModules.has(childModule)) {
      logger.debug("Adding module " + childModule.name + " to " + this.name);
      this.childModules.add(childModule);
      childModule.parentScope = this;
    } else {
      logger.debug("Module " + childModule.name + " already added to " + this.name);
    }
  }

  
  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ScopingEntity", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
//    exporter.addProperty("namespaces", this.getModules());
  }
}
