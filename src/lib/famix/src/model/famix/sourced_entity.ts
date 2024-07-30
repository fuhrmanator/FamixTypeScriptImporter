import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { SourceLanguage } from "./source_language";
import { Entity } from "./entity";
import { Comment } from "./comment";
import { SourceAnchor } from "./source_anchor";
import { logger } from "../../../../../analyze";

export class SourcedEntity extends Entity {

  private isStub: boolean;

  public getIsStub(): boolean {
    return this.isStub;
  }

  public setIsStub(isStub: boolean): void {
    this.isStub = isStub;
  }

  private sourceAnchor: SourceAnchor;

  public getSourceAnchor(): SourceAnchor {
    return this.sourceAnchor;
  }

  public setSourceAnchor(sourceAnchor: SourceAnchor): void {
    if (this.sourceAnchor === undefined) {
      this.sourceAnchor = sourceAnchor;
      sourceAnchor.setElement(this);
    }
  }

  private comments: Set<Comment> = new Set();

  public getComments(): Set<Comment> {
    return this.comments;
  }

  public addComment(comment: Comment): void {
    if (!this.comments.has(comment)) {
      this.comments.add(comment);
      comment.setContainer(this);
    } else {
      logger.debug("Adding comment that is already in comments: " + comment.getJSON() + " to " + this.getJSON());
    }
  }

  private declaredSourceLanguage: SourceLanguage;

  public getDeclaredSourceLanguage(): SourceLanguage {
    return this.declaredSourceLanguage;
  }

  public setDeclaredSourceLanguage(declaredSourceLanguage: SourceLanguage): void {
    this.declaredSourceLanguage = declaredSourceLanguage;
    declaredSourceLanguage.addSourcedEntity(this);
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("SourcedEntity", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("isStub", this.getIsStub());
    exporter.addProperty("sourceAnchor", this.getSourceAnchor());
    exporter.addProperty("comments", this.getComments());
    exporter.addProperty("declaredSourceLanguage", this.getDeclaredSourceLanguage());
  }
}
