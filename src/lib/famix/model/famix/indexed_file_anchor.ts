import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { SourceAnchor } from "./source_anchor";

export class IndexedFileAnchor extends SourceAnchor {

  private _startPos!: number;
  private _endPos!: number;
  private _fileName!: string;

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("IndexedFileAnchor", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("startPos", this.startPos);
    exporter.addProperty("endPos", this.endPos);
    exporter.addProperty("fileName", this.fileName);
  }

    get startPos(): number {
        return this._startPos;
    }

    set startPos(startPos: number) {
        this._startPos = startPos;
    }

    get endPos(): number {
        return this._endPos;
    }

    set endPos(endPos: number) {
        this._endPos = endPos;
    }

    get fileName(): string {
        return this._fileName;
    }

    set fileName(fileName: string) {
        this._fileName = fileName;
    }
}
