import { Importer } from '../src/analyze';
import { Comment } from '../src/lib/famix/src/model/famix/comment';
import { getCommentTextFromCommentViaAnchor } from './testUtils';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/abstractClassWithComments.ts", `// before
abstract class MyAbstractClass {} // a comment
// after
/* test */
/**
 * test2
 */
function tst() {}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for abstract class with comments', () => {
    
    it("should contain one class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(1);
    });

    const theAbstractClass = fmxRep._getFamixClass("{abstractClassWithComments.ts}.MyAbstractClass[ClassDeclaration]");

    it("should contain an abstract class MyAbstractClass", () => {
        expect(theAbstractClass).toBeTruthy();
        if (theAbstractClass) {
            expect(theAbstractClass.getIsAbstract()).toBe(true);
        }
    });

    it("should have two comments for the abstract class", () => {
        expect(theAbstractClass?.getComments().size).toBe(2);
        const comments = Array.from(theAbstractClass?.getComments() as Set<Comment>);
        expect(getCommentTextFromCommentViaAnchor(comments[0], project)).toBe(`// before`);
        expect(comments[0]?.getContainer()).toBe(theAbstractClass);
        expect(getCommentTextFromCommentViaAnchor(comments[1], project)).toBe(`// a comment`);
        expect(comments[1]?.getContainer()).toBe(theAbstractClass);
    });

    it("should contain one function", () => {
        expect(fmxRep._getAllEntitiesWithType("Function").size).toBe(1);
    });

    const theFunction = fmxRep._getFamixFunction("{abstractClassWithComments.ts}.tst[FunctionDeclaration]");

    it("should have three comments for the function", () => {
        expect(theFunction?.getComments().size).toBe(3);
        const comments = Array.from(theFunction?.getComments() as Set<Comment>);
        expect(getCommentTextFromCommentViaAnchor(comments[0], project)).toBe(`// after`);
        expect(comments[0]?.getContainer()).toBe(theFunction);
        expect(comments[0]?.getIsJSDoc()).toBe(false);
        expect(getCommentTextFromCommentViaAnchor(comments[1], project)).toBe(`/* test */`);
        expect(comments[1]?.getContainer()).toBe(theFunction);
        expect(comments[1]?.getIsJSDoc()).toBe(false);
        expect(getCommentTextFromCommentViaAnchor(comments[2], project)).toBe(`/**
 * test2
 */`);
        expect(comments[2]?.getContainer()).toBe(theFunction); 
        expect(comments[2]?.getIsJSDoc()).toBe(true);
    });
});
