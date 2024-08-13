import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { Type } from "./type";
import { Method } from "./method";
import { Property } from "./property";
import { Inheritance } from "./inheritance";

export class Interface extends Type {

    private _properties: Set<Property> = new Set();

    public addProperty(property: Property): void {
        if (!this._properties.has(property)) {
            this._properties.add(property);
            property.setParentEntity(this);
        }
    }

    private _methods: Set<Method> = new Set();

    public addMethod(method: Method): void {
        if (!this._methods.has(method)) {
            this._methods.add(method);
            method.setParentEntity(this);
        }
    }

    private _superInheritances: Set<Inheritance> = new Set();

    public addSuperInheritance(superInheritance: Inheritance): void {
        if (!this._superInheritances.has(superInheritance)) {
            this._superInheritances.add(superInheritance);
            superInheritance.subclass = this;
        }
    }

    private _subInheritances: Set<Inheritance> = new Set();

    public addSubInheritance(subInheritance: Inheritance): void {
        if (!this._subInheritances.has(subInheritance)) {
            this._subInheritances.add(subInheritance);
            subInheritance.superclass = this;
        }
    }


    public getJSON(): string {
        const json: FamixJSONExporter = new FamixJSONExporter("Interface", this);
        this.addPropertiesToExporter(json);
        return json.getJSON();
    }

    public addPropertiesToExporter(exporter: FamixJSONExporter): void {
        super.addPropertiesToExporter(exporter);
        exporter.addProperty("attributes", this.properties);
        exporter.addProperty("methods", this.methods);
        exporter.addProperty("superInheritances", this.superInheritances);
        exporter.addProperty("subInheritances", this.subInheritances);
    }

    get properties(): Set<Property> {
        return this._properties;
    }

    get methods(): Set<Method> {
        return this._methods;
    }

    get superInheritances(): Set<Inheritance> {
        return this._superInheritances;
    }

    get subInheritances(): Set<Inheritance> {
        return this._subInheritances;
    }
}
