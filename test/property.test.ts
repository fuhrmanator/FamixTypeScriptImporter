import { Importer, Property } from "../src";
import { createProject } from "./testUtils";

describe('Property', () => {
    it("should work with properties in class", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/someFile.ts",
            `class Chicken {
                a: number;
            }
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_PROPERTIES = 1;

        const properties = Array.from(fmxRep._getAllEntitiesWithType('Property')) as Array<Property>;
        const property = properties[0];

        expect(properties.length).toBe(NUMBER_OF_PROPERTIES);

        expect(property.readOnly).toBe(false);
        expect(property.isDefinitelyAssigned).toBe(false);
        expect(property.isOptional).toBe(false);
        expect(property.isJavaScriptPrivate).toBe(false);
        // ??? Should not be private?
        expect(property.visibility).toBe("");
        expect(property.isClassSide).toBe(false);
        expect(property.parentEntity).toBeDefined();
        expect(property.parentEntity.name).toBe("Chicken");
    });

    it("should work with properties in interface", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/someFile.ts",
            `interface Chicken {
                a: number;
            }
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_PROPERTIES = 1;

        const properties = Array.from(fmxRep._getAllEntitiesWithType('Property')) as Array<Property>;
        const property = properties[0];

        expect(properties.length).toBe(NUMBER_OF_PROPERTIES);

        expect(property.readOnly).toBe(false);
        expect(property.isDefinitelyAssigned).toBe(false);
        expect(property.isOptional).toBe(false);
        expect(property.isJavaScriptPrivate).toBe(false);
        // ??? Should not be private?
        expect(property.visibility).toBe("");
        expect(property.isClassSide).toBe(false);
        expect(property.parentEntity).toBeDefined();
        expect(property.parentEntity.name).toBe("Chicken");
    });

    it("should work with public static readonly properties", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/someFile.ts",
            `class Chicken {
                public static readonly a: number;
            }
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_PROPERTIES = 1;

        const properties = Array.from(fmxRep._getAllEntitiesWithType('Property')) as Array<Property>;
        const property = properties[0];

        expect(properties.length).toBe(NUMBER_OF_PROPERTIES);

        expect(property.readOnly).toBe(true);
        expect(property.isDefinitelyAssigned).toBe(false);
        expect(property.isOptional).toBe(false);
        expect(property.isJavaScriptPrivate).toBe(false);
        expect(property.visibility).toBe("public");
        expect(property.isClassSide).toBe(true);
        expect(property.parentEntity).toBeDefined();
        expect(property.parentEntity.name).toBe("Chicken");
    });

    it("should work with optional properties", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/someFile.ts",
            `class Chicken {
                protected a?: number;
            }
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_PROPERTIES = 1;

        const properties = Array.from(fmxRep._getAllEntitiesWithType('Property')) as Array<Property>;
        const property = properties[0];

        expect(properties.length).toBe(NUMBER_OF_PROPERTIES);

        expect(property.readOnly).toBe(false);
        expect(property.isDefinitelyAssigned).toBe(false);
        expect(property.isOptional).toBe(true);
        expect(property.isJavaScriptPrivate).toBe(false);
        expect(property.visibility).toBe("protected");
        expect(property.isClassSide).toBe(false);
        expect(property.parentEntity).toBeDefined();
        expect(property.parentEntity.name).toBe("Chicken");
    });

    it("should work with definitely assigned properties", () => {
        const importer = new Importer();
        const project = createProject();

        project.createSourceFile("/someFile.ts",
            `class Chicken {
                protected a!: number;
            }
        `);

        const fmxRep = importer.famixRepFromProject(project);

        const NUMBER_OF_PROPERTIES = 1;

        const properties = Array.from(fmxRep._getAllEntitiesWithType('Property')) as Array<Property>;
        const property = properties[0];

        expect(properties.length).toBe(NUMBER_OF_PROPERTIES);

        expect(property.readOnly).toBe(false);
        expect(property.isDefinitelyAssigned).toBe(true);
        expect(property.isOptional).toBe(false);
        expect(property.isJavaScriptPrivate).toBe(false);
        expect(property.visibility).toBe("protected");
        expect(property.isClassSide).toBe(false);
        expect(property.parentEntity).toBeDefined();
        expect(property.parentEntity.name).toBe("Chicken");
    });
});