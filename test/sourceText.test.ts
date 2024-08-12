import { Importer, config } from "../src/analyze";
import { IndexedFileAnchor, Method, Module, ScriptEntity } from "../src/lib/famix/src/model/famix";
import GraphemeSplitter from "grapheme-splitter";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/test_src/simple.ts",
    `let a: number = 1;
export class A {
    /**
     * Sends the current player back the number of spaces.
     * @param numberOfSpaces The number of spaces to move back.
     * @throws Error if the number of spaces is greater than the current square index.
     */
    public moveBack(numberOfSpaces: number) {
        let currentSquareIndex = this.board.indexOf(this.currentPlayer.currentSquare);
    }
}`, { overwrite: true }).saveSync();

// multi-code point emoji is handled differently in JavaScript (two chars) and Pharo (one character)
project.createSourceFile("/test_src/a-b.ts", `let c = "💷", d = 5;`);

config.expectGraphemes = true;
const fmxRep = importer.famixRepFromProject(project);

describe('Tests for source text', () => {

    it("should have a class '{test_src/simple.ts}.A' with the proper source text", () => {
        const theClass = fmxRep._getFamixClass("{test_src/simple.ts}.A[ClassDeclaration]");
        expect(theClass).toBeDefined();
        const sourceAnchor = theClass?.getSourceAnchor() as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.getStartPos()).toBe(19 + 1);
        expect(sourceAnchor.getEndPos()).toBe(402 + 1);
        expect(sourceAnchor.getFileName()).toBe("test_src/simple.ts");
        expect(project.getSourceFileOrThrow(
            sourceAnchor.getFileName()).getFullText().substring(
                sourceAnchor.getStartPos() - 1, sourceAnchor.getEndPos() - 1))
                .toBe(
`export class A {
    /**
     * Sends the current player back the number of spaces.
     * @param numberOfSpaces The number of spaces to move back.
     * @throws Error if the number of spaces is greater than the current square index.
     */
    public moveBack(numberOfSpaces: number) {
        let currentSquareIndex = this.board.indexOf(this.currentPlayer.currentSquare);
    }
}`);
    });

    it("should have a method 'moveBack' with the proper source text", () => {
        const theMethod = Array.from(fmxRep._getAllEntitiesWithType("Method") as Set<Method>)[0];
        const sourceAnchor = theMethod.getSourceAnchor() as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.getStartPos()).toBe(266 + 1);
        expect(sourceAnchor.getEndPos()).toBe(400 + 1);
        expect(sourceAnchor.getFileName()).toBe("test_src/simple.ts");
        expect(project.getSourceFileOrThrow(
            sourceAnchor.getFileName()).getFullText().substring(
                sourceAnchor.getStartPos() - 1, sourceAnchor.getEndPos() - 1))
                .toBe(`public moveBack(numberOfSpaces: number) {
        let currentSquareIndex = this.board.indexOf(this.currentPlayer.currentSquare);
    }`

                );
    });

    it("should have a Variable 'a' with the proper source text", () => {
        const theFile = Array.from(fmxRep._getAllEntitiesWithType("Module") as Set<Module>)[0];
        const theVariable = Array.from(theFile.getVariables())[0];
        const sourceAnchor = theVariable.getSourceAnchor() as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.getStartPos()).toBe(4 + 1);
        expect(sourceAnchor.getEndPos()).toBe(17 + 1);
        expect(sourceAnchor.getFileName()).toBe("test_src/simple.ts");
        expect(project.getSourceFileOrThrow(
            sourceAnchor.getFileName()).getFullText().substring(
                sourceAnchor.getStartPos() - 1, sourceAnchor.getEndPos() - 1))
                .toBe("a: number = 1");
    });

    it("should have a Variable 'currentSquareIndex' with the proper source text", () => {
        const theMethod = Array.from(fmxRep._getAllEntitiesWithType("Method") as Set<Method>)[0];
        const theVariable = Array.from(theMethod.getVariables())[0];
        const sourceAnchor = theVariable.getSourceAnchor() as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.getStartPos()).toBe(320 + 1);
        expect(sourceAnchor.getEndPos()).toBe(393 + 1);
        expect(sourceAnchor.getFileName()).toBe("test_src/simple.ts");
        expect(project.getSourceFileOrThrow(
            sourceAnchor.getFileName()).getFullText().substring(
                sourceAnchor.getStartPos() - 1, sourceAnchor.getEndPos() - 1))
                .toBe("currentSquareIndex = this.board.indexOf(this.currentPlayer.currentSquare)");
    });

    const splitter = new GraphemeSplitter();
    const abFile = Array.from(fmxRep._getAllEntitiesWithType("ScriptEntity") as Set<ScriptEntity>)[0];

    it("should have variable 'c' with the proper source text", () => {
        expect(abFile).toBeDefined();
        const theVariable = Array.from(abFile.getVariables())[0];
        const sourceAnchor = theVariable.getSourceAnchor() as IndexedFileAnchor;
        const testSourceWithGraphemes = splitter.splitGraphemes('c = "💷"');
        expect(testSourceWithGraphemes.length).toBe(7);
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.getStartPos()).toBe(4 + 1);
        expect(sourceAnchor.getEndPos()).toBe(4 + testSourceWithGraphemes.length + 1);
        expect(sourceAnchor.getFileName()).toBe("test_src/a-b.ts");
        const sourceFileTextWithGraphemes = splitter.splitGraphemes(project.getSourceFileOrThrow(sourceAnchor.getFileName()).getFullText());
        expect(sourceFileTextWithGraphemes.slice(sourceAnchor.getStartPos() - 1, sourceAnchor.getEndPos() - 1)).toEqual(testSourceWithGraphemes);
    });

    it("should have variable 'd' with the proper source text", () => {
        const theVariable = Array.from(abFile.getVariables())[1];
        const sourceAnchor = theVariable.getSourceAnchor() as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.getStartPos()).toBe(13 + 1);
        expect(sourceAnchor.getEndPos()).toBe(18 + 1);
        expect(sourceAnchor.getFileName()).toBe("test_src/a-b.ts");
        const sourceFileTextWithGraphemes = splitter.splitGraphemes(project.getSourceFileOrThrow(sourceAnchor.getFileName()).getFullText());
        const testSourceWithGraphemes = splitter.splitGraphemes('d = 5');
        expect(sourceFileTextWithGraphemes.slice(sourceAnchor.getStartPos() - 1, sourceAnchor.getEndPos() - 1)).toEqual(testSourceWithGraphemes);    });

});
