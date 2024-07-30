import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ScopingEntity } from "./scoping_entity";

export class ScriptEntity extends ScopingEntity {

  private numberOfLinesOfText: number;

  public getNumberOfLinesOfText(): number {
    return this.numberOfLinesOfText;
  }

  public setNumberOfLinesOfText(numberOfLinesOfText: number): void {
    this.numberOfLinesOfText = numberOfLinesOfText;
  }

  private numberOfCharacters: number;

  public getNumberOfCharacters(): number {
    return this.numberOfCharacters;
  }

  public setNumberOfCharacters(numberOfCharacters: number): void {
    this.numberOfCharacters = numberOfCharacters;
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ScriptEntity", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
