import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { SourcedEntity } from "./sourced_entity";
import { Invocation } from "./invocation";
import { ImportClause } from "./import_clause";
import { Alias } from "./alias";
import { Decorator } from "./decorator";
import { FullyQualifiedNameEntity } from "../interfaces";

export class NamedEntity extends SourcedEntity implements FullyQualifiedNameEntity {

    private _fullyQualifiedName!: string;
    private _receivedInvocations: Set<Invocation> = new Set();

    public addReceivedInvocation(receivedInvocation: Invocation): void {
        if (!this._receivedInvocations.has(receivedInvocation)) {
            this._receivedInvocations.add(receivedInvocation);
            receivedInvocation.receiver = this;
        }
    }

    private _incomingImports: Set<ImportClause> = new Set();

    public addIncomingImport(anImport: ImportClause): void {
        if (!this._incomingImports.has(anImport)) {
            this._incomingImports.add(anImport);
            anImport.importedEntity = this;  // opposite
        }
    }

    public removeIncomingImport(anImport: ImportClause): void {
        if (this._incomingImports.has(anImport)) {
            this._incomingImports.delete(anImport);
        }
    }

    private _name!: string;
    private _aliases: Set<Alias> = new Set();

    public addAlias(alias: Alias): void {
        if (!this._aliases.has(alias)) {
            this._aliases.add(alias);
            alias.parentEntity = this;
        }
    }

    private _decorators: Set<Decorator> = new Set();

    public addDecorator(decorator: Decorator): void {
        if (!this._decorators.has(decorator)) {
            this._decorators.add(decorator);
            decorator.decoratedEntity = this;
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
        exporter.addProperty("incomingImports", this.incomingImports);
        exporter.addProperty("name", this.name);
        // exporter.addProperty("aliases", this.getAliases());  /* since these generate Unknown property messages */
        exporter.addProperty("decorators", this.decorators);
    }

    get fullyQualifiedName() {
        return this._fullyQualifiedName;
    }

    set fullyQualifiedName(fullyQualifiedName: string) {
        this._fullyQualifiedName = fullyQualifiedName;
    }

    get receivedInvocations() {
        return this._receivedInvocations;
    }

    get incomingImports() {
        return this._incomingImports;
    }

    get name() {
        return this._name;
    }

    set name(name: string) {
        this._name = name;
    }

    get aliases() {
        return this._aliases;
    }

    get decorators() {
        return this._decorators;
    }
}
