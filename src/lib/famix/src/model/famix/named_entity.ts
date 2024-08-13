import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { SourcedEntity } from "./sourced_entity";
import { Invocation } from "./invocation";
import { ImportClause } from "./import_clause";
import { Alias } from "./alias";
import { Decorator } from "./decorator";

export class NamedEntity extends SourcedEntity {

  private fullyQualifiedName: string;

  public getFullyQualifiedName(): string {
    return this.fullyQualifiedName;
  }

  public setFullyQualifiedName(fullyQualifiedName: string): void {
    this.fullyQualifiedName = fullyQualifiedName;
  }

  private receivedInvocations: Set<Invocation> = new Set();

  public getReceivedInvocations(): Set<Invocation> {
    return this.receivedInvocations;
  }

  public addReceivedInvocation(receivedInvocation: Invocation): void {
    if (!this.receivedInvocations.has(receivedInvocation)) {
      this.receivedInvocations.add(receivedInvocation);
      receivedInvocation.setReceiver(this);
    }
  }

  private incomingImports: Set<ImportClause> = new Set();

  public getIncomingImports(): Set<ImportClause> {
    return this.incomingImports;
  }

  public addIncomingImport(anImport: ImportClause): void {
    if (!this.incomingImports.has(anImport)) {
      this.incomingImports.add(anImport);
      anImport.setImportedEntity(this);  // opposite
    }
  }

  private name: string;

  public getName(): string {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }

  private aliases: Set<Alias> = new Set();

  public getAliases(): Set<Alias> {
    return this.aliases;
  }

  public addAlias(alias: Alias): void {
    if (!this.aliases.has(alias)) {
      this.aliases.add(alias);
      alias.parentEntity = this;
    }
  }

  private decorators: Set<Decorator> = new Set();

  public getDecorators(): Set<Decorator> {
    return this.decorators;
  }

  public addDecorator(decorator: Decorator): void {
    if (!this.decorators.has(decorator)) {
      this.decorators.add(decorator);
      decorator.setDecoratedEntity(this);
    }
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("NamedEntity", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    // exporter.addProperty("fullyQualifiedName", this.getFullyQualifiedName());
    // exporter.addProperty("incomingInvocations", this.getReceivedInvocations());
    exporter.addProperty("incomingImports", this.getIncomingImports());
    exporter.addProperty("name", this.getName());
    // exporter.addProperty("aliases", this.getAliases());  /* since these generate Unknown property messages */
    exporter.addProperty("decorators", this.getDecorators());
  }
}
