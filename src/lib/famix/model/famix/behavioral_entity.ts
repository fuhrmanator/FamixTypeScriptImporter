import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { ContainerEntity } from "./container_entity";
import { Parameter } from "./parameter";
import { Invocation } from "./invocation";
import { EntityTyping } from "./entity_typing";
import { ParametricEntityTyping } from "./parametric_entity_typing";

export class BehavioralEntity extends ContainerEntity {

    private _signature!: string;
    private _parameters: Set<Parameter> = new Set();

    public addParameter(parameter: Parameter): void {
        if (!this._parameters.has(parameter)) {
            this._parameters.add(parameter);
            parameter.parentEntity = this;
        }
    }

    private _numberOfParameters!: number;
    private _incomingInvocations: Set<Invocation> = new Set();

    public addIncomingInvocation(incomingInvocation: Invocation): void {
        if (!this._incomingInvocations.has(incomingInvocation)) {
            this._incomingInvocations.add(incomingInvocation);
            incomingInvocation.addCandidate(this);
        }
    }

    private _typing!: EntityTyping | ParametricEntityTyping;

    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("BehavioralEntity", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("signature", this.signature);
        exporter.addProperty("parameters", this.parameters);
        exporter.addProperty("numberOfParameters", this.numberOfParameters);
        exporter.addProperty("incomingInvocations", this.incomingInvocations);
    }

    get signature(): string {
        return this._signature;
    }

    set signature(signature: string) {
        this._signature = signature;
    }

    get parameters(): Set<Parameter> {
        return this._parameters;
    }

    get numberOfParameters(): number {
        return this._numberOfParameters;
    }

    set numberOfParameters(numberOfParameters: number) {
        this._numberOfParameters = numberOfParameters;
    }

    get incomingInvocations(): Set<Invocation> {
        return this._incomingInvocations;
    }

    get typing(): EntityTyping | ParametricEntityTyping {
        return this._typing;
    }

    set typing(typing: EntityTyping | ParametricEntityTyping) {
        this._typing = typing;
    }
}
