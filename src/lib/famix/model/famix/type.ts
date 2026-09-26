import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { StructuralEntity } from "./structural_entity";
import { ContainerEntity } from "./container_entity";
import { Reference } from "./reference";
import { BehavioralEntity } from "./behavioral_entity";
import { Alias } from "./alias";
import { EntityTyping } from "./entity_typing";
import { Concretization } from "./concretization";

export class Type extends ContainerEntity {

    private _container!: ContainerEntity;
    private _typeAliases: Set<Alias> = new Set();

    public addTypeAlias(typeAlias: Alias): void {
        if (!this._typeAliases.has(typeAlias)) {
            this._typeAliases.add(typeAlias);
            typeAlias.aliasedEntity = this;
        }
    }

    private _structuresWithDeclaredType: Set<StructuralEntity> = new Set();

    private _behavioralEntitiesWithDeclaredType: Set<BehavioralEntity> = new Set();

    private _incomingReferences: Set<Reference> = new Set();

    public addIncomingReference(incomingReference: Reference): void {
        if (!this._incomingReferences.has(incomingReference)) {
            this._incomingReferences.add(incomingReference);
            incomingReference.target = this;
        }
    }

    private _incomingTypings: Set<EntityTyping> = new Set();

    public addIncomingTyping(incomingTyping: EntityTyping): void {
        if (!this._incomingTypings.has(incomingTyping)) {
            this._incomingTypings.add(incomingTyping);
            incomingTyping.declaredType = this;
        }
    }

    private _outgoingConcretizations: Set<Concretization> = new Set();

    public addOutgoingConcretization(outgoingConcretization: Concretization): void {
        if (!this._outgoingConcretizations.has(outgoingConcretization)) {
            this._outgoingConcretizations.add(outgoingConcretization);
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
        exporter.addProperty("incomingReferences", this.incomingReferences);
        exporter.addProperty("outgoingConcretizations", this.outgoingConcretizations);
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

    get outgoingConcretizations() {
        return this._outgoingConcretizations;
    }
}
