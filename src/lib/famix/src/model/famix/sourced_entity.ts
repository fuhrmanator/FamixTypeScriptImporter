import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { SourceLanguage } from "./source_language";
import { Entity } from "./entity";
import { Comment } from "./comment";
import { SourceAnchor } from "./source_anchor";
import { logger } from "../../../../../analyze";

export class SourcedEntity extends Entity {

    private _isStub: boolean;
    private _sourceAnchor: SourceAnchor;
    private _comments: Set<Comment> = new Set();

    public addComment(comment: Comment): void {
        if (!this._comments.has(comment)) {
            this._comments.add(comment);
            comment.container = this;
        } else {
            logger.debug("Adding comment that is already in comments: " + comment.getJSON() + " to " + this.getJSON());
        }
    }

    private _declaredSourceLanguage: SourceLanguage;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("SourcedEntity", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("isStub", this.isStub);
        exporter.addProperty("sourceAnchor", this.sourceAnchor);
        exporter.addProperty("comments", this.comments);
        exporter.addProperty("declaredSourceLanguage", this.declaredSourceLanguage);
    }

    get isStub() {
        return this._isStub;
    }

    set isStub(isStub: boolean) {
        this._isStub = isStub;
    }

    get sourceAnchor() {
        return this._sourceAnchor;
    }

    set sourceAnchor(sourceAnchor: SourceAnchor) {
        if (this._sourceAnchor === undefined) {
            this._sourceAnchor = sourceAnchor;
            sourceAnchor.element = this;
        }
    }

    get comments() {
        return this._comments;
    }

    get declaredSourceLanguage() {
        return this._declaredSourceLanguage;
    }

    set declaredSourceLanguage(declaredSourceLanguage: SourceLanguage) {
        this._declaredSourceLanguage = declaredSourceLanguage;
        declaredSourceLanguage.addSourcedEntity(this);
    }
}
