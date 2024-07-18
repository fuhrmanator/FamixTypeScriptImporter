import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Decorator } from '../src/lib/famix/src/model/famix/decorator';
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

    const properties = Array.from(fmxRep._getFamixClass("{propertyDefinedInConstructorSignature.ts}.Point")?.getProperties() as Set<Property>) as Array<Property>;

    it("should contain two properties", () => {
        expect(properties.length).toBe(2);
    });

    it("should contain a property 'x'", () => {
        const theProperty = properties.find((f) => f.getName() === "x");
        expect(theProperty).toBeTruthy();
    });

    it("should contain a readonly property 'y'", () => {
        const theProperty = properties.find((f) => f.getName() === "y");
        expect(theProperty).toBeTruthy();
        expect(theProperty?.readOnly).toBe(true);
    });

});
