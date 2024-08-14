import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ContainerEntity } from "./container_entity";
import { StructuralEntity } from "./structural_entity";

export class Variable extends StructuralEntity {

    private _parentContainerEntity!: ContainerEntity;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Variable", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("parentBehaviouralEntity", this.parentContainerEntity);
    }

    get parentContainerEntity() {
        return this._parentContainerEntity;
    }

    set parentContainerEntity(parentContainerEntity: ContainerEntity) {
        this._parentContainerEntity = parentContainerEntity;
    }
}
