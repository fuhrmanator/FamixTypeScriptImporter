import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Entity } from "./entity";
import { ParametricEntityTyping } from "./parametric_entity_typing";
import { ParametricInvocation } from "./parametric_invocation";
import { ParametricInheritance } from "./parametric_inheritance";
import { ParametricReference } from "./parametric_reference";
import { Type } from "./type";
import { TypeParameter } from "./type_parameter";
import { ParametricClass } from "./parametric_class";
import { ParametricFunction } from "./parametric_function";
import { ParametricInterface } from "./parametric_interface";
import { ParametricMethod } from "./parametric_method";

// More will be added here (e.g. ParametricImplementation, once Implementation exists)
type ParametricAssociation = ParametricEntityTyping | ParametricInvocation | ParametricInheritance | ParametricReference;

export class Concretization extends Entity {

    private _typeParameter!: TypeParameter;
    private _typeArgument!: Type;
    private _triggeringAssociation!: ParametricAssociation;

    public getJSON(): string {
      const json: FamixJSONExporter = new FamixJSONExporter("Concretization", this);
      this.addPropertiesToExporter(json);
      return json.getJSON();
    }
  
    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
      super.addPropertiesToExporter(exporter);
      exporter.addProperty("typeParameter", this._typeParameter);
      exporter.addProperty("typeArgument", this._typeArgument);
      exporter.addProperty("triggeringAssociation", this._triggeringAssociation);
    }

    get typeParameter(): TypeParameter {
        return this._typeParameter;
    }

    set typeParameter(typeParameter: TypeParameter) {
        this._typeParameter = typeParameter;
        typeParameter.addConcretization(this);
    }

    get typeArgument(): Type {
        return this._typeArgument;
    }

    set typeArgument(typeArgument: Type) {
        this._typeArgument = typeArgument;
        typeArgument.addOutgoingConcretization(this);
    }

    get triggeringAssociation(): ParametricAssociation {
        return this._triggeringAssociation;
    }

    set triggeringAssociation(triggeringAssociation: ParametricAssociation) {
        this._triggeringAssociation = triggeringAssociation;
    }
}
