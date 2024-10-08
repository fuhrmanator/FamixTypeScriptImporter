import { Importer } from '../src/analyze';
import { Property } from '../src/lib/famix/model/famix/property';
import { project } from './testUtils';

const importer = new Importer();
project.createSourceFile("/propertyDefinedInConstructorSignature.ts",
`class Point {
  constructor(private x: number, public readonly y: number, protected z: number) {}
}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for properties in a Class', () => {
    
    it("should contain one class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(1);
    });

    const pointProperties = Array.from(fmxRep._getFamixClass("{propertyDefinedInConstructorSignature.ts}.Point[ClassDeclaration]")?.properties as Set<Property>) as Array<Property>;
    const allProperties =  fmxRep._getAllEntitiesWithType("Property");

    it("should contain two properties", () => {
        expect(allProperties.size).toBe(3);
    });

    it("should contain a private property 'x'", () => {
        const theProperty = pointProperties.find((f) => f.name === "x");
        expect(theProperty).toBeTruthy();
        expect(theProperty?.readOnly).toBe(false);
        expect(theProperty?.visibility).toBe("private");
    });

    it("should contain a public readonly property 'y'", () => {
        const theProperty = pointProperties.find((f) => f.name === "y");
        expect(theProperty).toBeTruthy();
        expect(theProperty?.readOnly).toBe(true);
        expect(theProperty?.visibility).toBe("public");
    });

    it("should contain a protected property 'z'", () => {
        const theProperty = pointProperties.find((f) => f.name === "z");
        expect(theProperty).toBeTruthy();
        expect(theProperty?.readOnly).toBe(false);
        expect(theProperty?.visibility).toBe("protected");
    });

});
