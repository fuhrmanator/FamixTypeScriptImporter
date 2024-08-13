import { Importer } from '../src/analyze';
import { Function as FamixFunctionEntity } from "../src/lib/famix/src/model/famix/function";
import { Comment } from '../src/lib/famix/src/model/famix/comment';
import { IndexedFileAnchor } from '../src/lib/famix/src/model/famix/indexed_file_anchor';
import { getCommentTextFromCommentViaAnchor } from './testUtils';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/functionWithVariables.ts",
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
        expect(theFunction?.variables.size).toBe(3);
    });

    const firstVariable = Array.from(theFunction?.variables).find((p) => p.name === "i");
    const firstVariableComments = Array.from(firstVariable?.comments as Set<Comment>);

    it("should have a variable 'i' with three comments", () => {
        expect(firstVariable).toBeTruthy();
        expect(firstVariable?.parentContainerEntity).toBe(theFunction);
        expect(firstVariable?.comments.size).toBe(3);

        expect(getCommentTextFromCommentViaAnchor(firstVariableComments[0], project)).toBe(`/*comment 2*/`);
        expect(getCommentTextFromCommentViaAnchor(firstVariableComments[1], project)).toBe(`// comment 1`);
        expect(getCommentTextFromCommentViaAnchor(firstVariableComments[2], project)).toBe(`// comment 3`);
    
        expect(firstVariableComments[0]?.container).toBe(firstVariable);
        expect(firstVariableComments[1]?.container).toBe(firstVariable);
        expect(firstVariableComments[2]?.container).toBe(firstVariable);
    });

    it("should be of type number", () => {
        expect(firstVariable?.declaredType.name).toBe("number");
    });

    const secondVariable = Array.from(theFunction?.variables).find((p) => p.name === "j");
    const secondVariableComments = Array.from(secondVariable?.comments as Set<Comment>);

    it("should have a variable 'j' with two comments", () => {
        expect(secondVariable).toBeTruthy();
        expect(secondVariable?.parentContainerEntity).toBe(theFunction);
        expect(secondVariableComments.length).toBe(2);

        let anchor = secondVariableComments[0]?.sourceAnchor as IndexedFileAnchor;
        expect(anchor?.fileName.endsWith("functionWithVariables.ts")).toBe(true);
        expect(project.getSourceFileOrThrow(anchor.fileName).getFullText().substring(
            anchor.startPos - 1, anchor.endPos - 1)).toBe(`// comment 1`);

        anchor = secondVariableComments[1]?.sourceAnchor as IndexedFileAnchor;
        expect(anchor?.fileName.endsWith("functionWithVariables.ts")).toBe(true);
        expect(project.getSourceFileOrThrow(anchor.fileName).getFullText().substring(
            anchor.startPos - 1, anchor.endPos - 1)).toBe(`// comment 3`);

        expect(secondVariableComments[0]?.container).toBe(secondVariable);
        expect(secondVariableComments[1]?.container).toBe(secondVariable);
    });
    
    it("should be of type number", () => {
        expect(secondVariable?.declaredType.name).toBe("number");
    });

    const thirdVariable = Array.from(theFunction?.variables).find((p) => p.name === "x");
    it("should have a variable 'x'", () => {
        expect(thirdVariable).toBeTruthy();
        expect(thirdVariable?.parentContainerEntity).toBe(theFunction);
    });

    it("should be of type string", () => {
        expect(thirdVariable?.declaredType.name).toBe("string");
    });
});
