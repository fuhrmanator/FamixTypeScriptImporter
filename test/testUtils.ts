import { IndexedFileAnchor } from "../src/lib/famix/src/model/famix/indexed_file_anchor";
import { Comment } from "../src/lib/famix/src/model/famix/comment";
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
    return comment?.getSourceAnchor() as IndexedFileAnchor;
}

function getCommentFromAnchor(anchor: IndexedFileAnchor, project: Project) {
    return project.getSourceFileOrThrow(anchor.getFileName()).getFullText().substring(anchor.getStartPos() - 1, anchor.getEndPos() - 1);
}

export function getCommentTextFromCommentViaAnchor(comment: Comment, project: Project) {
    return getCommentFromAnchor(getIndexedFileAnchorFromComment(comment), project);
}

export function getTextFromAnchor(anchor: IndexedFileAnchor, project: Project) {
    return project.getSourceFileOrThrow(anchor.getFileName()).getFullText().substring(anchor.getStartPos() - 1, anchor.getEndPos() - 1);
}
