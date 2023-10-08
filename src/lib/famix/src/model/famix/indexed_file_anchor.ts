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
    exporter.addProperty("fileName", this.getFileName());
  }
}
