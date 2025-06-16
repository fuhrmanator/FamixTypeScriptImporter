import { Importer } from '../src/analyze';
import { Property, Method } from "../src/lib/famix/model/famix";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/access.ts",
`class AccessClassForTesting {
    private privateAttribute;
    public publicAttribute;
    
    public returnAccessName() {
        return this.publicAttribute;
    }
    
    private privateMethod() {
        let tempAccess = this.privateAttribute; // second access
        return this.privateAttribute;
    }
}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Accesses', () => {

    const jsonOutput = fmxRep.getJSON();
    const parsedModel = JSON.parse(jsonOutput);
    let testAccessClsFromJSON;
    let accessClsMethodsFromJSON : Array<Method>;
    let accessClsAttributesFromJSON : Array<Property>;

    it("should have a class with two methods and two attributes", () => {
        const expectedAttributeNames: Array<string> = ['privateAttribute', 'publicAttribute'];
        const expectedMethodNames: Array<string> = ['privateMethod', 'returnAccessName'];
        testAccessClsFromJSON = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === "AccessClassForTesting"))[0];
        // Note: the JSON (moose) info uses "attributes" (Java style name) rather than "properties" (TypeScript)
        expect(testAccessClsFromJSON.attributes.length).toBe(expectedAttributeNames.length);
        expect(testAccessClsFromJSON.methods.length).toBe(expectedMethodNames.length);
        accessClsMethodsFromJSON = parsedModel.filter(e => testAccessClsFromJSON.methods.some(m => m.ref === e.id));
        expect(accessClsMethodsFromJSON.length).toBeGreaterThan(0);
        const checkMethodName = accessClsMethodsFromJSON.every(m => expectedMethodNames.includes(m.name));
        expect(checkMethodName).toBe(true);
        accessClsAttributesFromJSON = parsedModel.filter(e => testAccessClsFromJSON.attributes.some(a => a.ref === e.id));
        expect(accessClsAttributesFromJSON.length).toBeGreaterThan(0);
        const checkAttributeName = accessClsAttributesFromJSON.every(a => expectedAttributeNames.includes(a.name));
        expect(checkAttributeName).toBe(true);
    });

    it("should have an access to privateAttribute in privateMethod", () => {
        const famixAccess = parsedModel.filter(el =>
            (el.accessor !== undefined && el.variable !== undefined && el.FM3 === "FamixTypeScript.Access"
                && ((fmxRep.getFamixEntityById(el.accessor.ref) as Method).name === "privateMethod") 
                && ((fmxRep.getFamixEntityById(el.variable.ref) as Property).name === "privateAttribute")
                ))[0];
        expect(famixAccess).toBeTruthy();
    });

    it("should have an access to publicAttribute in returnAccessName", () => {
        const famixAccess = parsedModel.filter(el =>
            (el.accessor !== undefined && el.variable !== undefined && el.FM3 === "FamixTypeScript.Access"
                && ((fmxRep.getFamixEntityById(el.accessor.ref) as Method).name === "returnAccessName") 
                && ((fmxRep.getFamixEntityById(el.variable.ref) as Property).name === "publicAttribute")
                ))[0];
        expect(famixAccess).toBeTruthy();
    });

    it("should have only one access to privateAttribute in privateMethod", () => {
        const famixAccess = parsedModel.filter(el =>
            (el.accessor !== undefined && el.variable !== undefined && el.FM3 === "FamixTypeScript.Access"
                && ((fmxRep.getFamixEntityById(el.accessor.ref) as Method).name === "privateMethod") 
                && ((fmxRep.getFamixEntityById(el.variable.ref) as Property).name === "privateAttribute")
                ));
        expect(famixAccess.length).toBe(1);
    });
});
