import { Importer } from "../src/analyze";
import { Variable, StructuralEntity, ImportClause } from "../src/lib/famix/src/model/famix";
import { project } from './testUtils';

const importer = new Importer();
//logger.settings.minLevel = 0; // all your messages are belong to us

project.createSourceFile("/test_src/exporter1.ts",
    `export const hasBigInt = typeof BigInt !== 'undefined';
     export const yellow = 3;`);

project.createSourceFile("/test_src/exporter2.ts",
    `export const hasBigInt = false;`);

project.createSourceFile("/test_src/importer.ts",
    `import { hasBigInt } from "./exporter2";`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for exported and imported variable', () => {

    it(`should have two variables`, () => {
        const variables = fmxRep._getAllEntitiesWithType("Variable") as Set<Variable>;
        expect(variables).toBeTruthy();
        expect(variables.size).toBe(3);
    });

    // reifying the imported variable (not supported)
    it.skip(`imported hasBigInt should refer to the variable in exporter2.ts`, () => {
        // get ImportClause
        const importClauses = fmxRep._getAllEntitiesWithType("ImportClause") as Set<ImportClause>;
        expect(importClauses).toBeTruthy();
        expect(importClauses.size).toBe(1);
        const importClause = importClauses.values().next().value;
        expect(importClause).toBeTruthy();
        // get variable
        const importedVariable = importClause.importedEntity as Variable;
        expect(importedVariable).toBeTruthy();
        expect(importedVariable.name).toBe("hasBigInt");
        // check if the variable is the one in exporter2.ts
        const variables = fmxRep._getAllEntitiesWithType("Variable") as Set<Variable>;
        expect(variables).toBeTruthy();
        const variableIterator = variables.values();
        let variable = variableIterator.next().value as Variable;
        while (variable) {
            if (variable.name === "hasBigInt") {
                break;
            }
            variable = variableIterator.next().value as Variable;
        }
        expect(variable).toBeTruthy();
        expect(variable.fullyQualifiedName).toBe("{test_src/exporter2.ts}.hasBigInt[VariableDeclaration]");
    });

});
