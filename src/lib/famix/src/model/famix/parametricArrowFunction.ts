import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ArrowFunction } from "./arrowFunction";

export class ParametricArrowFunction extends ArrowFunction {

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ParametricArrowFunction", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
  }
}
