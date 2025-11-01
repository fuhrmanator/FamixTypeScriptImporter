import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { FullyQualifiedNameEntity } from "../interfaces";
import { Module } from "./module";
import { NamedEntity } from "./named_entity";
import { EntityWithSourceAnchor } from "./sourced_entity";

export class ImportClause extends EntityWithSourceAnchor implements FullyQualifiedNameEntity {

    private _importingEntity!: Module;
    private _importedEntity!: NamedEntity;
    private _moduleSpecifier!: string;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("ImportClause", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("importingEntity", this.importingEntity);
        exporter.addProperty("importedEntity", this.importedEntity);
        // unknown property below
        //    exporter.addProperty("moduleSpecifier", this.getModuleSpecifier());
    }

    get importingEntity(): Module {
        return this._importingEntity;
    }

    set importingEntity(importer: Module) {
        this._importingEntity = importer;
        importer.addOutgoingImport(this); // opposite
    }

    get importedEntity(): NamedEntity {
        return this._importedEntity;
    }

    set importedEntity(importedEntity: NamedEntity) {
        this._importedEntity = importedEntity;
        importedEntity.addIncomingImport(this); // incomingImports in Famix TImportable/TImport
    }

    get moduleSpecifier(): string {
        return this._moduleSpecifier;
    }

    set moduleSpecifier(moduleSpecifier: string) {
        this._moduleSpecifier = moduleSpecifier;
    }

    get fullyQualifiedName(): string {
        return `${this.importingEntity.fullyQualifiedName} -> ${this.importedEntity.fullyQualifiedName}`;
    }
}
