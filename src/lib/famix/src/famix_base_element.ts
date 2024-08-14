import { logger } from "../../../analyze";
import { FamixJSONExporter } from "./famix_JSON_exporter";
// import { FamixRepository } from "./famix_repository";

export abstract class FamixBaseElement {

    public id!: number;

    // constructor(repo: FamixRepository) {
    //   repo.addElement(this);
    // }

    constructor() {
    }

    public abstract getJSON(): string;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        logger.debug("addPropertiesToExporter not implemented for " + this.constructor.name + `(${exporter})`);
    }
}
