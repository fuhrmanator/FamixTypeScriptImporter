import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ScopingEntity } from "./scoping_entity";

export class ScriptEntity extends ScopingEntity {

    private _numberOfLinesOfText: number;
    private _numberOfCharacters: number;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("ScriptEntity", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
    }

    get numberOfLinesOfText() {
        return this._numberOfLinesOfText;
    }

    set numberOfLinesOfText(numberOfLinesOfText: number) {
        this._numberOfLinesOfText = numberOfLinesOfText;
    }

    get numberOfCharacters() {
        return this._numberOfCharacters;
    }

    set numberOfCharacters(numberOfCharacters: number) {
        this._numberOfCharacters = numberOfCharacters;
    }
}
