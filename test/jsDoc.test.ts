import { Importer } from '../src/analyze';
import { Comment } from '../src/lib/famix/model/famix/comment';
import { getCommentTextFromCommentViaAnchor } from './testUtils';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/jsDoc.ts",
`/**
 * Gets the name.
 * @param person - Person to get the name from.
 */
function getName(person: string) {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for JS doc', () => {
    
    it("should contain one function and one comment", () => {
        expect(fmxRep._getAllEntitiesWithType("Function").size).toBe(1);
        expect(fmxRep._getAllEntitiesWithType("Comment").size).toBe(1);
    });

    const theFunction = fmxRep._getFamixFunction("{jsDoc.ts}.getName[FunctionDeclaration]");
    const theJSDoc = Array.from(fmxRep._getAllEntitiesWithType("Comment") as Set<Comment>)[0];

    it("should have one comment for the function", () => {
        expect(theFunction?.comments.size).toBe(1);
        expect(theFunction?.comments.has(theJSDoc)).toBe(true);
        expect(getCommentTextFromCommentViaAnchor(theJSDoc, project)).toBe(`/**
 * Gets the name.
 * @param person - Person to get the name from.
 */`);
        expect(theJSDoc?.container).toBe(theFunction);
        expect(theJSDoc?.isJSDoc).toBe(true);
    });
});
