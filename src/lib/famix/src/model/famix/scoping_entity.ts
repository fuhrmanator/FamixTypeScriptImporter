import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ContainerEntity } from "./container_entity";
import { Namespace } from "./namespace";
import { logger } from "../../../../../analyze";

export class ScopingEntity extends ContainerEntity {

  private childrenNamespaces: Set<Namespace> = new Set();

  public getNamespaces(): Set<Namespace> {
    return this.childrenNamespaces;
  }

  public addNamespace(childNamespace: Namespace): void {
    if (!this.childrenNamespaces.has(childNamespace)) {
      logger.debug("Adding namespace " + childNamespace.getName() + " to " + this.getName());
      this.childrenNamespaces.add(childNamespace);
      childNamespace.setParentScope(this);
    } else {
      logger.debug("Namespace " + childNamespace.getName() + " already added to " + this.getName());
    }
  }

  
  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ScopingEntity", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("namespaces", this.getNamespaces());
  }
}
