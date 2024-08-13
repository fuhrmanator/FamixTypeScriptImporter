import { FamixBaseElement } from "./famix_base_element";

/**
 * This class is used to export Famix elements to JSON
 */
export class FamixJSONExporter {

    private element: FamixBaseElement; // A Famix element to export
    private bufferArray: any = {}; // A buffer to store the properties of the Famix element
    private FamixPrefix = "FamixTypeScript"; // Prefix of the Famix element

    /**
     * Constructor of the FamixJSONExporter class
     * @param packageClass Name of a Famix class
     * @param element A Famix element to export, this element is an instance of the class named "packageClass"
     */
    constructor(packageClass: string, element: FamixBaseElement) {
        this.element = element;
        this.bufferArray["FM3"] = this.FamixPrefix + "." + packageClass;
        this.bufferArray["id"] = this.element.id;
    }

    /**
     * Adds a property to the Famix element
     * @param name Name of the property
     * @param prop A property
     */
    public addProperty(name: string, prop: unknown): void {
        if (prop instanceof Set) {
            const valueArray: Array<unknown> = [];
            for (const value of Array.from(prop.values())) {
                if (value instanceof FamixBaseElement) {
                    valueArray.push({ "ref": value.id });
                }
                else {
                    valueArray.push(value);
                }
            }
            this.bufferArray[name] = valueArray;
        }
        else if (prop instanceof FamixBaseElement) {
            this.bufferArray[name] = { "ref": prop.id };
        }
        else if (prop !== undefined && !(prop instanceof Set)) {
            this.bufferArray[name] = prop;
        }
    }

    /**
     * Gets a JSON representation of the Famix element
     * @returns A JSON representation of the Famix element
     */
    public getJSON(): string {
        return JSON.stringify(this.bufferArray);
    }
}
