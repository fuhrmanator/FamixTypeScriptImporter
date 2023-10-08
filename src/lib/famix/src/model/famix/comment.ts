import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { SourcedEntity } from "./sourced_entity";

export class Comment extends SourcedEntity {

  private isJSDoc: boolean;

  public getIsJSDoc(): boolean {
    return this.isJSDoc;
  }

  public setIsJSDoc(isJSDoc: boolean): void {
    this.isJSDoc = isJSDoc;
  }

  private container: SourcedEntity;

  public getContainer(): SourcedEntity {
    return this.container;
  }

  public setContainer(container: SourcedEntity): void {
    this.container = container;
    container.addComment(this);
  }

  private content: string;

  public getContent(): string {
    return this.content;
  }

  public setContent(content: string): void {
    this.content = content;
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Comment", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("isJSDoc", this.getIsJSDoc());
    exporter.addProperty("container", this.getContainer());
    exporter.addProperty("content", this.getContent());
  }
}
