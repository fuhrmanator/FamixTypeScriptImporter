import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { ContainerEntity } from "./container_entity";
import { Parameter } from "./parameter";
import { Invocation } from "./invocation";
import { ParameterType } from "./parameter_type";

export class BehavioralEntity extends ContainerEntity {

    private _signature: string;
    private _parameters: Set<Parameter> = new Set();

    public addParameter(parameter: Parameter): void {
        if (!this._parameters.has(parameter)) {
            this._parameters.add(parameter);
            parameter.setParentEntity(this);
        }
    }

    private _numberOfParameters: number;
    private _incomingInvocations: Set<Invocation> = new Set();

    public addIncomingInvocation(incomingInvocation: Invocation): void {
        if (!this._incomingInvocations.has(incomingInvocation)) {
            this._incomingInvocations.add(incomingInvocation);
            incomingInvocation.addCandidate(this);
        }
    }

    private _declaredType: Type;
    private _genericParameters: Set<ParameterType> = new Set();

    public addGenericParameter(genericParameter: ParameterType): void {
        if (!this._genericParameters.has(genericParameter)) {
            this._genericParameters.add(genericParameter);
            genericParameter.setParentGeneric(this);
        }
    }

    clearGenericParameters(): void {
        this._genericParameters.clear();
    }

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
        exporter.addProperty("declaredType", this.declaredType);
        /* don't add the property here, since it doesn't apply to all subclasses */
        //    exporter.addProperty("genericParameters", this.getGenericParameters());
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

    get declaredType(): Type {
        return this._declaredType;
    }

    set declaredType(declaredType: Type) {
        this._declaredType = declaredType;
        declaredType.addBehavioralEntityWithDeclaredType(this);
    }

    get genericParameters(): Set<ParameterType> {
        return this._genericParameters;
    }
}
