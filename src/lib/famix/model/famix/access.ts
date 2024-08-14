import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { StructuralEntity } from "./structural_entity";
import { ContainerEntity } from "./container_entity";
import { Entity } from "./entity";

export class Access extends Entity {

    private _accessor!: ContainerEntity;
    private _variable!: StructuralEntity;
    private _isWrite!: boolean;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Access", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("accessor", this.accessor);
        exporter.addProperty("variable", this.variable);
        exporter.addProperty("isWrite", this.isWrite);
    }

    get accessor(): ContainerEntity {
        return this._accessor;
    }

    set accessor(accessor: ContainerEntity) {
        this._accessor = accessor;
        accessor.addAccess(this);
    }

    get variable(): StructuralEntity {
        return this._variable;
    }

    set variable(variable: StructuralEntity) {
        this._variable = variable;
        variable.addIncomingAccess(this);
    }

    get isWrite(): boolean {
        return this._isWrite;
    }

    set isWrite(isWrite: boolean) {
        this._isWrite = isWrite;
    }
}
