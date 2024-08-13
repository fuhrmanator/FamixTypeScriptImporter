import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Class } from "./class";
import { Entity } from "./entity";
import { Interface } from "./interface";

export class Inheritance extends Entity {

    private _superclass: Class | Interface;
    private _subclass: Class | Interface;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Inheritance", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("superclass", this.superclass);
        exporter.addProperty("subclass", this.subclass);
    }

    get superclass() {
        return this._superclass;
    }

    set superclass(superclass: Class | Interface) {
        this._superclass = superclass;
        superclass.addSubInheritance(this);
    }

    get subclass() {
        return this._subclass;
    }

    set subclass(subclass: Class | Interface) {
        this._subclass = subclass;
        subclass.addSuperInheritance(this);
    }
}
