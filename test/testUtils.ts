import { IndexedFileAnchor } from "../src/lib/famix/model/famix/indexed_file_anchor";
import { Comment } from "../src/lib/famix/model/famix/comment";
import { Project } from "ts-morph";

export const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

function getIndexedFileAnchorFromComment(comment: Comment) {
    return comment?.sourceAnchor as IndexedFileAnchor;
}

function getCommentFromAnchor(anchor: IndexedFileAnchor, project: Project) {
    return project.getSourceFileOrThrow(anchor.fileName).getFullText().substring(anchor.startPos - 1, anchor.endPos - 1);
}

export function getCommentTextFromCommentViaAnchor(comment: Comment, project: Project) {
    return getCommentFromAnchor(getIndexedFileAnchorFromComment(comment), project);
}

export function getTextFromAnchor(anchor: IndexedFileAnchor, project: Project) {
    return project.getSourceFileOrThrow(anchor.fileName).getFullText().substring(anchor.startPos - 1, anchor.endPos - 1);
}
