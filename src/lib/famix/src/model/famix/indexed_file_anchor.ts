import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { SourceAnchor } from "./source_anchor";

export class IndexedFileAnchor extends SourceAnchor {

  private startPos: number;

  public getStartPos(): number {
    return this.startPos;
  }

  public setStartPos(startPos: number): void {
    this.startPos = startPos;
  }

  private endPos: number;

  public getEndPos(): number {
    return this.endPos;
  }

  public setEndPos(endPos: number): void {
    this.endPos = endPos;
  }

  // Yo, these are supposed to be derived in Moose, not stored in the model

  // private endLine: number;

  // public getEndLine(): number {
  //   return this.endLine;
  // }

  // public setEndLine(sourceEndLine: number) {
  //   this.endLine = sourceEndLine;
  // }

  // private startLine: number;

  // public getStartLine(): number {
  //   return this.startLine;
  // }

  // public setStartLine(sourceStartLine: number) {
  //   this.startLine = sourceStartLine;
  // }

  private fileName: string;

  public getFileName(): string {
    return this.fileName;
  }

  public setFileName(fileName: string): void {
    this.fileName = fileName;
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("IndexedFileAnchor", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("startPos", this.getStartPos());
    exporter.addProperty("endPos", this.getEndPos());
    // exporter.addProperty("startLine", this.getStartLine());
    // exporter.addProperty("endLine", this.getEndLine());
    exporter.addProperty("fileName", this.getFileName());
  }
}
