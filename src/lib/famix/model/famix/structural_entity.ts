import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { Access } from "./access";
import { NamedEntity } from "./named_entity";

export class StructuralEntity extends NamedEntity {

    private _incomingAccesses: Set<Access> = new Set();

    public addIncomingAccess(incomingAccess: Access): void {
        if (!this._incomingAccesses.has(incomingAccess)) {
            this._incomingAccesses.add(incomingAccess);
            incomingAccess.variable = this;
        }
    }

    public removeIncomingAccess(incomingAccess: Access): void {
        if (this._incomingAccesses.has(incomingAccess)) {
            this._incomingAccesses.delete(incomingAccess);
        }
    }

    private _declaredType!: Type;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("StructuralEntity", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("incomingAccesses", this.incomingAccesses);
        exporter.addProperty("declaredType", this.declaredType);
    }

    get incomingAccesses() {
        return this._incomingAccesses;
    }

    get declaredType() {
        return this._declaredType;
    }

    set declaredType(declaredType: Type) {
        this._declaredType = declaredType;
        declaredType.addStructureWithDeclaredType(this);
    }
}
