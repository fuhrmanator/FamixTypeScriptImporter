import { Project, SourceFile } from "ts-morph";
import { Importer } from "../../src/analyze";
import { FamixRepository } from "../../src/lib/famix/famix_repository";
import { createProject } from "../testUtils";

export class IncrementalUpdateProjectBuilder {
    private project: Project;
    private importer: Importer;

    constructor() {
        this.importer = new Importer();
        this.project = createProject();
    }

    addSourceFile(fileName: string, code: string): IncrementalUpdateProjectBuilder {
        this.project.createSourceFile(fileName, code);
        return this;
    }

    changeSourceFile(fileName: string, newCode: string): SourceFile {
        const sourceFile = this.project.getSourceFile(fileName)!;
        sourceFile.replaceText([0, sourceFile.getFullText().length], newCode);
        return sourceFile;
    }

    build(): { importer: Importer; famixRep: FamixRepository; } {
        const famixRep = this.importer.famixRepFromProject(this.project);
        return { importer: this.importer, famixRep };
    }
}