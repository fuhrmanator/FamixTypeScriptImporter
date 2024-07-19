import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Property } from '../src/lib/famix/src/model/famix/property';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);
project.createSourceFile("./src/propertyDefinedInConstructorSignature.ts",
`class Point {
  constructor(public x: number, public readonly y: number) {}
}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for properties in a Class', () => {
    
    it("should contain one class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(1);
    });

    const pointProperties = Array.from(fmxRep._getFamixClass("{propertyDefinedInConstructorSignature.ts}.Point")?.getProperties() as Set<Property>) as Array<Property>;
    const allProperties =  fmxRep._getAllEntitiesWithType("Property");

    it("should contain two properties", () => {
        expect(allProperties.size).toBe(2);
    });

    it("should contain a property 'x'", () => {
        const theProperty = pointProperties.find((f) => f.getName() === "x");
        expect(theProperty).toBeTruthy();
    });

    it("should contain a readonly property 'y'", () => {
        const theProperty = pointProperties.find((f) => f.getName() === "y");
        expect(theProperty).toBeTruthy();
        expect(theProperty?.readOnly).toBe(true);
    });

});
