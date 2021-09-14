// automatically generated code, please do not change

import { FamixMseExporter } from "../../famix_mse_exporter";
import { Entity } from "./../famix/entity";
import { Class } from "./../famix/class";

export class Exception extends Entity {

  private exceptionExceptionClass: Class;

  // @FameProperty(name = "exceptionClass")
  public getExceptionClass(): Class {
    return this.exceptionExceptionClass;
  }

  public setExceptionClass(exceptionExceptionClass: Class) {
    this.exceptionExceptionClass = exceptionExceptionClass;
  }


  public getJSON(): string {
    const mse: FamixMseExporter = new FamixMseExporter("Exception", this);
    this.addPropertiesToExporter(mse);
    return mse.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixMseExporter) {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("exceptionClass", this.getExceptionClass());

  }

}

