import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { EntityWithSourceAnchor } from "./sourced_entity";

export class SourceAnchor extends Entity {

    private _element!: EntityWithSourceAnchor;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("SourceAnchor", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("element", this.element);
    }

    get element() {
        return this._element;
    }

    set element(element: EntityWithSourceAnchor) {
        if (this._element === undefined) {
            this._element = element;
            element.sourceAnchor = this;
        }
    }
}
