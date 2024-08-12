import { Importer, logger } from "../src/analyze";
import { Class, Variable, StructuralEntity, ImportClause } from "../src/lib/famix/src/model/famix";
import { project } from './testUtils';

const importer = new Importer();
//logger.settings.minLevel = 0; // all your messages are belong to us

project.createSourceFile("/test_src/exporter1.ts",
    `export const hasBigInt = false;`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for simple exported variable', () => {
    const variables = fmxRep._getAllEntitiesWithType("Variable") as Set<Variable>;

    it(`should have one variable`, () => {
        expect(variables).toBeTruthy();
        expect(variables.size).toBe(1);
    });

    it(`should have the variable in exporter1.ts`, () => {
        const hasBigIntVariable = variables.values().next().value as Variable;
        expect(hasBigIntVariable).toBeTruthy();
        expect(hasBigIntVariable.getName()).toBe("hasBigInt");
        expect(hasBigIntVariable.getFullyQualifiedName()).toBe("{test_src/exporter1.ts}.hasBigInt[VariableDeclaration]");
    });

});
