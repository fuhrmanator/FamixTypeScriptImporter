import { Importer, config } from "../src/analyze";
import { IndexedFileAnchor, Method, Module, ScriptEntity } from "../src/lib/famix/model/famix";
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
        const sourceAnchor = theClass?.sourceAnchor as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.startPos).toBe(19 + 1);
        expect(sourceAnchor.endPos).toBe(402);
        expect(sourceAnchor.fileName).toBe("test_src/simple.ts");
        expect(project.getSourceFileOrThrow(
            sourceAnchor.fileName).getFullText().substring(
                sourceAnchor.startPos - 1, sourceAnchor.endPos))
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
        const sourceAnchor = theMethod.sourceAnchor as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.startPos).toBe(266 + 1);
        expect(sourceAnchor.endPos).toBe(400);
        expect(sourceAnchor.fileName).toBe("test_src/simple.ts");
        expect(project.getSourceFileOrThrow(
            sourceAnchor.fileName).getFullText().substring(
                sourceAnchor.startPos - 1, sourceAnchor.endPos))
                .toBe(`public moveBack(numberOfSpaces: number) {
        let currentSquareIndex = this.board.indexOf(this.currentPlayer.currentSquare);
    }`

                );
    });

    it("should have a Variable 'a' with the proper source text", () => {
        const theFile = Array.from(fmxRep._getAllEntitiesWithType("Module") as Set<Module>)[0];
        const theVariable = Array.from(theFile.variables)[0];
        const sourceAnchor = theVariable.sourceAnchor as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.startPos).toBe(4 + 1);
        expect(sourceAnchor.endPos).toBe(17);
        expect(sourceAnchor.fileName).toBe("test_src/simple.ts");
        expect(project.getSourceFileOrThrow(
            sourceAnchor.fileName).getFullText().substring(
                sourceAnchor.startPos - 1, sourceAnchor.endPos))
                .toBe("a: number = 1");
    });

    it("should have a Variable 'currentSquareIndex' with the proper source text", () => {
        const theMethod = Array.from(fmxRep._getAllEntitiesWithType("Method") as Set<Method>)[0];
        const theVariable = Array.from(theMethod.variables)[0];
        const sourceAnchor = theVariable.sourceAnchor as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.startPos).toBe(320 + 1);
        expect(sourceAnchor.endPos).toBe(393);
        expect(sourceAnchor.fileName).toBe("test_src/simple.ts");
        expect(project.getSourceFileOrThrow(
            sourceAnchor.fileName).getFullText().substring(
                sourceAnchor.startPos - 1, sourceAnchor.endPos))
                .toBe("currentSquareIndex = this.board.indexOf(this.currentPlayer.currentSquare)");
    });

    const splitter = new GraphemeSplitter();
    const abFile = Array.from(fmxRep._getAllEntitiesWithType("ScriptEntity") as Set<ScriptEntity>)[0];

    it("should have variable 'c' with the proper source text", () => {
        expect(abFile).toBeDefined();
        const theVariable = Array.from(abFile.variables)[0];
        const sourceAnchor = theVariable.sourceAnchor as IndexedFileAnchor;
        const testSourceWithGraphemes = splitter.splitGraphemes('c = "💷"');
        expect(testSourceWithGraphemes.length).toBe(7);
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.startPos).toBe(4 + 1);
        expect(sourceAnchor.endPos).toBe(4 + testSourceWithGraphemes.length);
        expect(sourceAnchor.fileName).toBe("test_src/a-b.ts");
        const sourceFileTextWithGraphemes = splitter.splitGraphemes(project.getSourceFileOrThrow(sourceAnchor.fileName).getFullText());
        expect(sourceFileTextWithGraphemes.slice(sourceAnchor.startPos - 1, sourceAnchor.endPos)).toEqual(testSourceWithGraphemes);
    });

    it("should have variable 'd' with the proper source text", () => {
        const theVariable = Array.from(abFile.variables)[1];
        const sourceAnchor = theVariable.sourceAnchor as IndexedFileAnchor;
        // note: the +1 is because the source anchor is 1-based, but ts-morph is 0-based
        expect(sourceAnchor.startPos).toBe(13 + 1);
        expect(sourceAnchor.endPos).toBe(18);
        expect(sourceAnchor.fileName).toBe("test_src/a-b.ts");
        const sourceFileTextWithGraphemes = splitter.splitGraphemes(project.getSourceFileOrThrow(sourceAnchor.fileName).getFullText());
        const testSourceWithGraphemes = splitter.splitGraphemes('d = 5');
        expect(sourceFileTextWithGraphemes.slice(sourceAnchor.startPos - 1, sourceAnchor.endPos)).toEqual(testSourceWithGraphemes);    });

});
