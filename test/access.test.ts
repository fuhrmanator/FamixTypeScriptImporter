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
    let testAccessCls;
    let accessClsMethods;
    let accessClsAttributes;

    it("should have a class with two methods and two attributes", () => {
        const expectedAttributeNames: Array<string> = ['privateAttribute', 'publicAttribute'];
        const expectedMethodNames: Array<string> = ['privateMethod', 'returnAccessName'];
        testAccessCls = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Class" && el.name === "AccessClassForTesting"))[0];
        expect(testAccessCls.attributes.length).toBe(expectedAttributeNames.length);
        expect(testAccessCls.methods.length).toBe(expectedMethodNames.length);
        accessClsMethods = parsedModel.filter(e => testAccessCls.methods.some(m => m.ref === e.id));
        expect(accessClsMethods.length).toBeGreaterThan(0);
        const checkMethodName = accessClsMethods.every(m => expectedMethodNames.includes(m.name));
        expect(checkMethodName).toBe(true);
        accessClsAttributes = parsedModel.filter(e => testAccessCls.attributes.some(a => a.ref === e.id));
        expect(accessClsAttributes.length).toBeGreaterThan(0);
        const checkAttributeName = accessClsAttributes.every(a => expectedAttributeNames.includes(a.name));
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
