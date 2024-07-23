import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Comment } from '../src/lib/famix/src/model/famix/comment';
import { IndexedFileAnchor } from '../src/lib/famix/src/model/famix/indexed_file_anchor';
import { get } from 'http';
import { getCommentTextFromCommentViaAnchor } from './testUtils';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

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

    const theFunction = fmxRep._getFamixFunction("{jsDoc.ts}.getName");
    const theJSDoc = Array.from(fmxRep._getAllEntitiesWithType("Comment") as Set<Comment>)[0];

    it("should have one comment for the function", () => {
        expect(theFunction?.getComments().size).toBe(1);
        expect(theFunction?.getComments().has(theJSDoc)).toBe(true);
        expect(getCommentTextFromCommentViaAnchor(theJSDoc, project)).toBe(`/**
 * Gets the name.
 * @param person - Person to get the name from.
 */`);
        expect(theJSDoc?.getContainer()).toBe(theFunction);
        expect(theJSDoc?.getIsJSDoc()).toBe(true);
    });
});
