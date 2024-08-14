import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { NamedEntity } from "./named_entity";

export class Decorator extends NamedEntity {

    private _decoratorExpression!: string;
    private _decoratedEntity: NamedEntity;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Decorator", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("expression", this.decoratorExpression);
        exporter.addProperty("decoratedEntity", this.decoratedEntity);
    }

    get decoratorExpression(): string {
        return this._decoratorExpression;
    }

    set decoratorExpression(decoratorExpression: string) {
        this._decoratorExpression = decoratorExpression;
    }

    get decoratedEntity(): NamedEntity {
        return this._decoratedEntity;
    }

    set decoratedEntity(decoratedEntity: NamedEntity) {
        this._decoratedEntity = decoratedEntity;
        decoratedEntity.addDecorator(this);
    }
}
