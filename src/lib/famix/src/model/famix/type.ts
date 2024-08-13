import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { StructuralEntity } from "./structural_entity";
import { ContainerEntity } from "./container_entity";
import { Reference } from "./reference";
import { BehavioralEntity } from "./behavioral_entity";
import { Alias } from "./alias";

export class Type extends ContainerEntity {

    private _container: ContainerEntity;
    private _typeAliases: Set<Alias> = new Set();

    public addTypeAlias(typeAlias: Alias): void {
        if (!this._typeAliases.has(typeAlias)) {
            this._typeAliases.add(typeAlias);
            typeAlias.aliasedEntity = this;
        }
    }

    private _structuresWithDeclaredType: Set<StructuralEntity> = new Set();

    public addStructureWithDeclaredType(structureWithDeclaredType: StructuralEntity): void {
        if (!this._structuresWithDeclaredType.has(structureWithDeclaredType)) {
            this._structuresWithDeclaredType.add(structureWithDeclaredType);
            structureWithDeclaredType.declaredType = this;
        }
    }

    private _behavioralEntitiesWithDeclaredType: Set<BehavioralEntity> = new Set();

    public addBehavioralEntityWithDeclaredType(behavioralEntityWithDeclaredType: BehavioralEntity): void {
        if (!this._behavioralEntitiesWithDeclaredType.has(behavioralEntityWithDeclaredType)) {
            this._behavioralEntitiesWithDeclaredType.add(behavioralEntityWithDeclaredType);
            behavioralEntityWithDeclaredType.declaredType = this;
        }
    }

    private _incomingReferences: Set<Reference> = new Set();

    public addIncomingReference(incomingReference: Reference): void {
        if (!this._incomingReferences.has(incomingReference)) {
            this._incomingReferences.add(incomingReference);
            incomingReference.target = this;
        }
    }

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Type", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("typeContainer", this.container);
        /* unsupported properties in MM so far */
        // exporter.addProperty("typeAliases", this.getTypeAliases());
        // exporter.addProperty("structuresWithDeclaredType", this.getStructuresWithDeclaredType());
        // exporter.addProperty("behavioralEntitiesWithDeclaredType", this.getBehavioralEntitiesWithDeclaredType());
        exporter.addProperty("incomingReferences", this.incomingReferences);
    }

    get container() {
        return this._container;
    }

    set container(container: ContainerEntity) {
        this._container = container;
        container.addType(this);
    }

    get typeAliases() {
        return this._typeAliases;
    }

    get structuresWithDeclaredType() {
        return this._structuresWithDeclaredType;
    }

    get behavioralEntitiesWithDeclaredType() {
        return this._behavioralEntitiesWithDeclaredType;
    }

    get incomingReferences() {
        return this._incomingReferences;
    }
}
