import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { Invocation } from "./invocation";
import { NamedEntity } from "./named_entity";
import { Reference } from "./reference";
import { Access } from "./access";
import { Function as FamixFunctionEntity } from "./function";
import { Variable } from "./variable";

export class ContainerEntity extends NamedEntity {

    private _parentContainerEntity: ContainerEntity;
    private _childrenContainerEntities: Set<ContainerEntity> = new Set();

    public addChildContainerEntity(childContainerEntity: ContainerEntity): void {
        if (!this._childrenContainerEntities.has(childContainerEntity)) {
            this._childrenContainerEntities.add(childContainerEntity);
            childContainerEntity.parentContainerEntity = this;
        }
    }

    private _cyclomaticComplexity: number;
    private _numberOfStatements: number;
    private _outgoingReferences: Set<Reference> = new Set();

    public addOutgoingReference(outgoingReference: Reference): void {
        if (!this._outgoingReferences.has(outgoingReference)) {
            this._outgoingReferences.add(outgoingReference);
            outgoingReference.source = this;
        }
    }

    private _numberOfLinesOfCode: number;
    private _outgoingInvocations: Set<Invocation> = new Set();

    public addOutgoingInvocation(outgoingInvocation: Invocation): void {
        if (!this._outgoingInvocations.has(outgoingInvocation)) {
            this._outgoingInvocations.add(outgoingInvocation);
            outgoingInvocation.sender = this;
        }
    }

    private _accesses: Set<Access> = new Set();

    public addAccess(access: Access): void {
        if (!this._accesses.has(access)) {
            this._accesses.add(access);
            access.accessor = this;
        }
    }

    private childrenTypes: Set<Type> = new Set();

    public addType(childType: Type): void {
        if (!this.childrenTypes.has(childType)) {
            this.childrenTypes.add(childType);
            childType.parentContainerEntity = this;
        }
    }

    private childrenFunctions: Set<FamixFunctionEntity> = new Set();

    public addFunction(childFunction: FamixFunctionEntity): void {
        if (!this.childrenFunctions.has(childFunction)) {
            this.childrenFunctions.add(childFunction);
            childFunction.parentContainerEntity = this;
        }
    }

    private _variables: Set<Variable> = new Set();

    public addVariable(variable: Variable): void {
        if (!this._variables.has(variable)) {
            this._variables.add(variable);
            variable.parentContainerEntity = this;
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
        //    exporter.addProperty("childrenContainerEntities", this.getChildrenContainerEntities());
        exporter.addProperty("cyclomaticComplexity", this.cyclomaticComplexity);
        exporter.addProperty("numberOfStatements", this.numberOfStatements);
        //    exporter.addProperty("outgoingReferences", this.getOutgoingReferences());  /* derived ?*/
        exporter.addProperty("numberOfLinesOfCode", this.numberOfLinesOfCode);
        //    exporter.addProperty("outgoingInvocations", this.getOutgoingInvocations());  /* derived ?*/
        //    exporter.addProperty("accesses", this.getAccesses());  /* derived ?*/
        exporter.addProperty("types", this.types);
        exporter.addProperty("functions", this.functions);
        exporter.addProperty("localVariables", this.variables);
    }

    get parentContainerEntity() {
        return this._parentContainerEntity;
    }

    set parentContainerEntity(parentContainerEntity: ContainerEntity) {
        this._parentContainerEntity = parentContainerEntity;
        parentContainerEntity.addChildContainerEntity(this);
    }

    get childrenContainerEntities(): Set<import("C:/Users/Cris/Documents/GitHub/FamixTypeScriptImporter/src/lib/famix/src/model/famix/container_entity").ContainerEntity> {
        return this._childrenContainerEntities;
    }

    get cyclomaticComplexity(): number {
        return this._cyclomaticComplexity;
    }

    set cyclomaticComplexity(cyclomaticComplexity: number) {
        this._cyclomaticComplexity = cyclomaticComplexity;
    }

    get numberOfStatements(): number {
        return this._numberOfStatements;
    }

    set numberOfStatements(numberOfStatements: number) {
        this._numberOfStatements = numberOfStatements;
    }

    get outgoingReferences() {
        return this._outgoingReferences;
    }

    get numberOfLinesOfCode(): number {
        return this._numberOfLinesOfCode;
    }

    set numberOfLinesOfCode(numberOfLinesOfCode: number) {
        this._numberOfLinesOfCode = numberOfLinesOfCode;
    }

    get outgoingInvocations() {
        return this._outgoingInvocations;
    }

    get accesses() {
        return this._accesses;
    }

    get types() {
        return this.childrenTypes;
    }

    get functions() {
        return this.childrenFunctions;
    }

    get variables() {
        return this._variables;
    }
}
