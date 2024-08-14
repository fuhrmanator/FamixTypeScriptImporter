import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { SourcedEntity } from "./sourced_entity";

export class Comment extends SourcedEntity {

  private _isJSDoc!: boolean;
  private _container!: SourcedEntity;
  private _content!: string;

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Comment", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("isJSDoc", this.isJSDoc);
    exporter.addProperty("commentedEntity", this.container);
    exporter.addProperty("content", this.content);
  }

    get isJSDoc(): boolean {
        return this._isJSDoc;
    }

    set isJSDoc(isJSDoc: boolean) {
        this._isJSDoc = isJSDoc;
    }

    get container(): SourcedEntity {
        return this._container;
    }

    set container(container: SourcedEntity) {
        this._container = container;
        container.addComment(this);
    }

    get content(): string {
        return this._content;
    }

    set content(content: string) {
        this._content = content;
    }
}
