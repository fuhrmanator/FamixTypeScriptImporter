// automatically generated code, please do not change

import {FamixMseExporter} from "../../famix_mse_exporter";
import {SourceLanguage} from "./../famix/source_language";

export class SmalltalkSourceLanguage extends SourceLanguage {


  public getJSON(): string {
    const mse: FamixMseExporter = new FamixMseExporter("FAMIX.SmalltalkSourceLanguage", this);
    this.addPropertiesToExporter(mse);
    return mse.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixMseExporter) {
    super.addPropertiesToExporter(exporter);

  }

}

