import { Importer } from '../src/analyze';
import { Function as FamixFunctionEntity } from "../src/lib/famix/src/model/famix/function";
import { Comment } from '../src/lib/famix/src/model/famix/comment';
import { Project } from 'ts-morph';
import { IndexedFileAnchor } from '../src/lib/famix/src/model/famix/indexed_file_anchor';
import { getCommentTextFromCommentViaAnchor } from './testUtils';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/functionWithVariables.ts",
`function fct(): number {
    // comment 1
    let i: number /*comment 2*/, j: number; // comment 3
    const x: string = "";
    return 0;
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for function with variables', () => {
    
    const theFunction = Array.from(fmxRep._getAllEntitiesWithType('Function'))[0] as FamixFunctionEntity;
    it("should have three variables", () => {
        expect(theFunction?.getVariables().size).toBe(3);
    });

    const firstVariable = Array.from(theFunction?.getVariables()).find((p) => p.getName() === "i");
    const firstVariableComments = Array.from(firstVariable?.getComments() as Set<Comment>);

    it("should have a variable 'i' with three comments", () => {
        expect(firstVariable).toBeTruthy();
        expect(firstVariable?.getParentContainerEntity()).toBe(theFunction);
        expect(firstVariable?.getComments().size).toBe(3);

        expect(getCommentTextFromCommentViaAnchor(firstVariableComments[0], project)).toBe(`/*comment 2*/`);
        expect(getCommentTextFromCommentViaAnchor(firstVariableComments[1], project)).toBe(`// comment 1`);
        expect(getCommentTextFromCommentViaAnchor(firstVariableComments[2], project)).toBe(`// comment 3`);
    
        expect(firstVariableComments[0]?.getContainer()).toBe(firstVariable);
        expect(firstVariableComments[1]?.getContainer()).toBe(firstVariable);
        expect(firstVariableComments[2]?.getContainer()).toBe(firstVariable);
    });

    it("should be of type number", () => {
        expect(firstVariable?.getDeclaredType().getName()).toBe("number");
    });

    const secondVariable = Array.from(theFunction?.getVariables()).find((p) => p.getName() === "j");
    const secondVariableComments = Array.from(secondVariable?.getComments() as Set<Comment>);

    it("should have a variable 'j' with two comments", () => {
        expect(secondVariable).toBeTruthy();
        expect(secondVariable?.getParentContainerEntity()).toBe(theFunction);
        expect(secondVariableComments.length).toBe(2);

        let anchor = secondVariableComments[0]?.getSourceAnchor() as IndexedFileAnchor;
        expect(anchor?.getFileName().endsWith("functionWithVariables.ts")).toBe(true);
        expect(project.getSourceFileOrThrow(anchor.getFileName()).getFullText().substring(
            anchor.getStartPos() - 1, anchor.getEndPos() - 1)).toBe(`// comment 1`);

        anchor = secondVariableComments[1]?.getSourceAnchor() as IndexedFileAnchor;
        expect(anchor?.getFileName().endsWith("functionWithVariables.ts")).toBe(true);
        expect(project.getSourceFileOrThrow(anchor.getFileName()).getFullText().substring(
            anchor.getStartPos() - 1, anchor.getEndPos() - 1)).toBe(`// comment 3`);

        expect(secondVariableComments[0]?.getContainer()).toBe(secondVariable);
        expect(secondVariableComments[1]?.getContainer()).toBe(secondVariable);
    });
    
    it("should be of type number", () => {
        expect(secondVariable?.getDeclaredType().getName()).toBe("number");
    });

    const thirdVariable = Array.from(theFunction?.getVariables()).find((p) => p.getName() === "x");
    it("should have a variable 'x'", () => {
        expect(thirdVariable).toBeTruthy();
        expect(thirdVariable?.getParentContainerEntity()).toBe(theFunction);
    });

    it("should be of type string", () => {
        expect(thirdVariable?.getDeclaredType().getName()).toBe("string");
    });
});
