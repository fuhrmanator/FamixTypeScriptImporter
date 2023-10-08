import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { ContainerEntity } from "./container_entity";
import { Parameter } from "./parameter";
import { Invocation } from "./invocation";
import { TypeParameter } from "./type_parameter";

export class BehavioralEntity extends ContainerEntity {

  private isGeneric: boolean;

  public getIsGeneric(): boolean {
    return this.isGeneric;
  }

  public setIsGeneric(isGeneric: boolean): void {
    this.isGeneric = isGeneric;
  }

  private signature: string;

  public getSignature(): string {
    return this.signature;
  }

  public setSignature(signature: string): void {
    this.signature = signature;
  }

  private parameters: Set<Parameter> = new Set();

  public getParameters(): Set<Parameter> {
    return this.parameters;
  }

  public addParameter(parameter: Parameter): void {
    if (!this.parameters.has(parameter)) {
      this.parameters.add(parameter);
      parameter.setParentEntity(this);
    }
  }

  private numberOfParameters: number;

  public getNumberOfParameters(): number {
    return this.numberOfParameters;
  }

  public setNumberOfParameters(numberOfParameters: number): void {
    this.numberOfParameters = numberOfParameters;
  }

  private incomingInvocations: Set<Invocation> = new Set();

  public getIncomingInvocations(): Set<Invocation> {
    return this.incomingInvocations;
  }

  public addIncomingInvocation(incomingInvocation: Invocation): void {
    if (!this.incomingInvocations.has(incomingInvocation)) {
      this.incomingInvocations.add(incomingInvocation);
      incomingInvocation.addCandidate(this);
    }
  }

  private declaredType: Type;

  public getDeclaredType(): Type {
    return this.declaredType;
  }

  public setDeclaredType(declaredType: Type): void {
    this.declaredType = declaredType;
    declaredType.addBehavioralEntityWithDeclaredType(this);
  }

  private typeParameters: Set<TypeParameter> = new Set();

  public getTypeParameters(): Set<TypeParameter> {
    return this.typeParameters;
  }

  public addTypeParameter(typeParameter: TypeParameter): void {
    if (!this.typeParameters.has(typeParameter)) {
      this.typeParameters.add(typeParameter);
      typeParameter.setParentGeneric(this);
    }
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("BehavioralEntity", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("isGeneric", this.getIsGeneric());
    exporter.addProperty("signature", this.getSignature());
    exporter.addProperty("parameters", this.getParameters());
    exporter.addProperty("numberOfParameters", this.getNumberOfParameters());
    exporter.addProperty("incomingInvocations", this.getIncomingInvocations());
    exporter.addProperty("declaredType", this.getDeclaredType());
    exporter.addProperty("typeParameters", this.getTypeParameters());
  }
}
