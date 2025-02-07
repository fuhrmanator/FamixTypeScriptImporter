import { Importer } from "../src/analyze";
import { Variable } from "../src/lib/famix/model/famix";
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
        expect(hasBigIntVariable.name).toBe("hasBigInt");
        expect(hasBigIntVariable.fullyQualifiedName).toBe("{test_src/exporter1.ts}.hasBigInt[VariableDeclaration]");
    });

});
