import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { Invocation } from "./invocation";
import { NamedEntity } from "./named_entity";
import { Reference } from "./reference";
import { Access } from "./access";
import { Function as FamixFunctionEntity } from "./function";
import { Variable } from "./variable";

export class ContainerEntity extends NamedEntity {

  private parentContainerEntity: ContainerEntity;

  public getParentContainerEntity(): ContainerEntity {
    return this.parentContainerEntity;
  }

  public setParentContainerEntity(parentContainerEntity: ContainerEntity): void {
    this.parentContainerEntity = parentContainerEntity;
    parentContainerEntity.addChildContainerEntity(this);
  }

  private childrenContainerEntities: Set<ContainerEntity> = new Set();

  public getChildrenContainerEntities(): Set<ContainerEntity> {
    return this.childrenContainerEntities;
  }

  public addChildContainerEntity(childContainerEntity: ContainerEntity): void {
    if (!this.childrenContainerEntities.has(childContainerEntity)) {
      this.childrenContainerEntities.add(childContainerEntity);
      childContainerEntity.setParentContainerEntity(this);
    }
  }

  private cyclomaticComplexity: number;

  public getCyclomaticComplexity(): number {
    return this.cyclomaticComplexity;
  }

  public setCyclomaticComplexity(cyclomaticComplexity: number): void {
    this.cyclomaticComplexity = cyclomaticComplexity;
  }

  private numberOfStatements: number;

  public getNumberOfStatements(): number {
    return this.numberOfStatements;
  }

  public setNumberOfStatements(numberOfStatements: number): void {
    this.numberOfStatements = numberOfStatements;
  }

  private outgoingReferences: Set<Reference> = new Set();

  public getOutgoingReferences(): Set<Reference> {
    return this.outgoingReferences;
  }

  public addOutgoingReference(outgoingReference: Reference): void {
    if (!this.outgoingReferences.has(outgoingReference)) {
      this.outgoingReferences.add(outgoingReference);
      outgoingReference.setSource(this);
    }
  }

  private numberOfLinesOfCode: number;

  public getNumberOfLinesOfCode(): number {
    return this.numberOfLinesOfCode;
  }

  public setNumberOfLinesOfCode(numberOfLinesOfCode: number): void {
    this.numberOfLinesOfCode = numberOfLinesOfCode;
  }

  private outgoingInvocations: Set<Invocation> = new Set();

  public getOutgoingInvocations(): Set<Invocation> {
    return this.outgoingInvocations;
  }

  public addOutgoingInvocation(outgoingInvocation: Invocation): void {
    if (!this.outgoingInvocations.has(outgoingInvocation)) {
      this.outgoingInvocations.add(outgoingInvocation);
      outgoingInvocation.setSender(this);
    }
  }

  private accesses: Set<Access> = new Set();

  public getAccesses(): Set<Access> {
    return this.accesses;
  }

  public addAccess(access: Access): void {
    if (!this.accesses.has(access)) {
      this.accesses.add(access);
      access.setAccessor(this);
    }
  }

  private childrenTypes: Set<Type> = new Set();

  public getTypes(): Set<Type> {
    return this.childrenTypes;
  }

  public addType(childType: Type): void {
    if (!this.childrenTypes.has(childType)) {
      this.childrenTypes.add(childType);
      childType.setParentContainerEntity(this);
    }
  }

  private childrenFunctions: Set<FamixFunctionEntity> = new Set();

  public getFunctions(): Set<FamixFunctionEntity> {
    return this.childrenFunctions;
  }

  public addFunction(childFunction: FamixFunctionEntity): void {
    if (!this.childrenFunctions.has(childFunction)) {
      this.childrenFunctions.add(childFunction);
      childFunction.setParentContainerEntity(this);
    }
  }

  private variables: Set<Variable> = new Set();

  public getVariables(): Set<Variable> {
    return this.variables;
  }

  public addVariable(variable: Variable): void {
    if (!this.variables.has(variable)) {
      this.variables.add(variable);
      variable.setParentContainerEntity(this);
    }
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("ContainerEntity", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
//    exporter.addProperty("parentBehaviouralEntity", this.getParentContainerEntity());
    exporter.addProperty("childrenContainerEntities", this.getChildrenContainerEntities());
    exporter.addProperty("cyclomaticComplexity", this.getCyclomaticComplexity());
    exporter.addProperty("numberOfStatements", this.getNumberOfStatements());
//    exporter.addProperty("outgoingReferences", this.getOutgoingReferences());  /* derived ?*/
    exporter.addProperty("numberOfLinesOfCode", this.getNumberOfLinesOfCode());
//    exporter.addProperty("outgoingInvocations", this.getOutgoingInvocations());  /* derived ?*/
//    exporter.addProperty("accesses", this.getAccesses());  /* derived ?*/
    exporter.addProperty("types", this.getTypes());
    exporter.addProperty("functions", this.getFunctions());
    exporter.addProperty("localVariables", this.getVariables());
  }
}
