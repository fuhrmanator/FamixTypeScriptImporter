import { FamixJSONExporter } from "./famix_JSON_exporter";
// import { FamixRepository } from "./famix_repository";

export abstract class FamixBaseElement {

  public id: number;

  // constructor(repo: FamixRepository) {
  //   repo.addElement(this);
  // }

  constructor(){
  }

  public abstract getJSON(): string;

  // @ts-ignore
  // tslint:disable-next-line:no-empty
  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
  }
}
