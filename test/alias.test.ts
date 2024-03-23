import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Alias } from '../src/lib/famix/src/model/famix';
import { Type } from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/alias.ts", 
`type Point = {
    x: number;
    y: number;
};`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for alias', () => {
    
    it("should contain one alias", () => {
        expect(fmxRep._getAllEntitiesWithType("Alias").size).toBe(1);
    });

    const theAlias = Array.from(fmxRep._getAllEntitiesWithType("Alias") as Set<Alias>)[0];
    it("should contain an alias Point", () => {
        expect(theAlias.getName()).toBe("Point");
    });

    const theType = Array.from(fmxRep._getAllEntitiesWithType("Type") as Set<Type>)[0];
    it("should contain a type Point", () => {
        expect(theType.getName()).toBe("Point");
    });
    
    const theFile = fmxRep._getFamixFile("alias.ts");
    it("should contain an alias on type Point", () => {
        expect(theFile?.getAliases().size).toBe(1);
        expect(Array.from(theFile?.getAliases() as Set<Alias>)[0]).toBe(theAlias);
        expect(theAlias.getAliasedEntity()).toBe(theType);
        expect(theAlias.getParentEntity()).toBe(theFile);
        expect(theType.getTypeAliases().size).toBe(1);
        expect(Array.from(theType.getTypeAliases())[0]).toBe(theAlias);
    });
});
