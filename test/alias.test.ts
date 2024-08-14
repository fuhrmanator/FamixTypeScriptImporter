import { Importer } from '../src/analyze';
import { Alias, IndexedFileAnchor } from '../src/lib/famix/model/famix';
import { Type } from '../src/lib/famix/model/famix';
import { getTextFromAnchor } from './testUtils';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/alias.ts", 
`type Point = {
    x: number;
    y: number;
};
type Text = string | { text: string };
type Callback = (data: string) => void;`);
const NUMBER_OF_ALIASES = 3;

const fmxRep = importer.famixRepFromProject(project);
const setOfAliases = fmxRep._getAllEntitiesWithType("Alias") as Set<Alias>;
const arrayOfAliases = Array.from(setOfAliases);
const arrayOfTypes = Array.from(fmxRep._getAllEntitiesWithType("Type") as Set<Type>);
const theFirstAlias = arrayOfAliases[0];
const theFirstType = arrayOfTypes[0];
const theFile = fmxRep._getFamixFile("alias.ts");

describe('Tests for alias', () => {
    
    it(`should contain ${NUMBER_OF_ALIASES} aliases`, () => {
        expect(setOfAliases.size).toBe(NUMBER_OF_ALIASES);
    });

    it("should contain an alias Point", () => {
        expect(theFirstAlias.name).toBe("Point");
    });

    it("should contain a type Point", () => {
        expect(theFirstType.name).toBe("Point");
    });
    
    const theFile = fmxRep._getFamixFile("alias.ts");
    it("should contain an alias on type Point", () => {
        expect(theFile?.aliases.size).toBe(NUMBER_OF_ALIASES);
        expect(Array.from(theFile?.aliases as Set<Alias>)[0]).toBe(theFirstAlias);
        expect(theFirstAlias.aliasedEntity).toBe(theFirstType);
        expect(theFirstAlias.parentEntity).toBe(theFile);
        expect(theFirstType.typeAliases.size).toBe(1);
        expect(Array.from(theFirstType.typeAliases)[0]).toBe(theFirstAlias);
    });

    it("should contain an IndexedFileAnchor", () => {
        const sourceAnchor = theFirstAlias.sourceAnchor;
        expect(sourceAnchor.constructor.name).toBe("IndexedFileAnchor");
        const indexedFileAnchor = sourceAnchor as IndexedFileAnchor;
        expect(indexedFileAnchor.fileName.endsWith("alias.ts")).toBe(true);
        const fileAnchorText = getTextFromAnchor(indexedFileAnchor, project);
        expect(fileAnchorText).toBe(`type Point = {
    x: number;
    y: number;
};`);
    });


    // test for the second alias
    it("should contain an alias Text", () => {
        expect(arrayOfAliases[1].name).toBe("Text");
    });

    it("should contain a type Text", () => {
        expect(arrayOfTypes[1].name).toBe("Text");
    });

    it("should contain an alias on type Text", () => {
        expect(theFile?.aliases.size).toBe(NUMBER_OF_ALIASES);
        expect(Array.from(theFile?.aliases as Set<Alias>)[1]).toBe(arrayOfAliases[1]);
        expect(arrayOfAliases[1].aliasedEntity).toBe(arrayOfTypes[1]);
        expect(arrayOfAliases[1].parentEntity).toBe(theFile);
        expect(arrayOfTypes[1].typeAliases.size).toBe(1);
        expect(Array.from(arrayOfTypes[1].typeAliases)[0]).toBe(arrayOfAliases[1]);
    });

    it("should contain an IndexedFileAnchor", () => {
        const sourceAnchor = arrayOfAliases[1].sourceAnchor;
        expect(sourceAnchor.constructor.name).toBe("IndexedFileAnchor");
        const indexedFileAnchor = sourceAnchor as IndexedFileAnchor;
        expect(indexedFileAnchor.fileName.endsWith("alias.ts")).toBe(true);
        const fileAnchorText = getTextFromAnchor(indexedFileAnchor, project);
        expect(fileAnchorText).toBe(`type Text = string | { text: string };`);
    });

    // write tests for the third alias
    it("should contain an alias Callback", () => {
        expect(arrayOfAliases[2].name).toBe("Callback");
    });

    it("should contain a type Callback", () => {
        expect(arrayOfTypes[2].name).toBe("Callback");
    });

    it("should contain an alias on type Callback", () => {
        expect(theFile?.aliases.size).toBe(NUMBER_OF_ALIASES);
        expect(Array.from(theFile?.aliases as Set<Alias>)[2]).toBe(arrayOfAliases[2]);
        expect(arrayOfAliases[2].aliasedEntity).toBe(arrayOfTypes[2]);
        expect(arrayOfAliases[2].parentEntity).toBe(theFile);
        expect(arrayOfTypes[2].typeAliases.size).toBe(1);
        expect(Array.from(arrayOfTypes[2].typeAliases)[0]).toBe(arrayOfAliases[2]);
    });

    it("should contain an IndexedFileAnchor", () => {
        const sourceAnchor = arrayOfAliases[2].sourceAnchor;
        expect(sourceAnchor.constructor.name).toBe("IndexedFileAnchor");
        const indexedFileAnchor = sourceAnchor as IndexedFileAnchor;
        expect(indexedFileAnchor.fileName.endsWith("alias.ts")).toBe(true);
        const fileAnchorText = getTextFromAnchor(indexedFileAnchor, project);
        expect(fileAnchorText).toBe(`type Callback = (data: string) => void;`);
    });
    
});
