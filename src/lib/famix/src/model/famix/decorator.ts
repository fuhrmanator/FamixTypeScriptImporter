import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { NamedEntity } from "./named_entity";

export class Decorator extends NamedEntity {

  private decoratorExpression: string;

  public getDecoratorExpression(): string {
    return this.decoratorExpression;
  }

  public setDecoratorExpression(decoratorExpression: string) {
    this.decoratorExpression = decoratorExpression;
  }

  private decoratedEntity: NamedEntity;
  
  public getDecoratedEntity(): NamedEntity {
    return this.decoratedEntity;
  }

  public setDecoratedEntity(decoratedEntity: NamedEntity): void {
    this.decoratedEntity = decoratedEntity;
    decoratedEntity.addDecorator(this);
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Decorator", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("decoratorExpression", this.getDecoratorExpression());
    exporter.addProperty("decoratedEntity", this.getDecoratedEntity());
  }
}
