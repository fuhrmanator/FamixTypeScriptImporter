import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Alias, IndexedFileAnchor } from '../src/lib/famix/src/model/famix';
import { Type } from '../src/lib/famix/src/model/famix';
import { getTextFromAnchor } from './testUtils';

const importer = new Importer();
const project = new Project();


project.createSourceFile("alias.ts", 
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
        expect(theFirstAlias.getName()).toBe("Point");
    });

    it("should contain a type Point", () => {
        expect(theFirstType.getName()).toBe("Point");
    });

    it("should contain an alias on type Point", () => {
        expect(theFile?.getAliases().size).toBe(NUMBER_OF_ALIASES);
        expect(Array.from(theFile?.getAliases() as Set<Alias>)[0]).toBe(theFirstAlias);
        expect(theFirstAlias.getAliasedEntity()).toBe(theFirstType);
        expect(theFirstAlias.getParentEntity()).toBe(theFile);
        expect(theFirstType.getTypeAliases().size).toBe(1);
        expect(Array.from(theFirstType.getTypeAliases())[0]).toBe(theFirstAlias);
    });

    it("should contain an IndexedFileAnchor", () => {
        const sourceAnchor = theFirstAlias.getSourceAnchor();
        expect(sourceAnchor.constructor.name).toBe("IndexedFileAnchor");
        const indexedFileAnchor = sourceAnchor as IndexedFileAnchor;
        expect(indexedFileAnchor.getFileName().endsWith("alias.ts")).toBe(true);
        const fileAnchorText = getTextFromAnchor(indexedFileAnchor, project);
        expect(fileAnchorText).toBe(`type Point = {
    x: number;
    y: number;
};`);
    });


    // test for the second alias
    it("should contain an alias Text", () => {
        expect(arrayOfAliases[1].getName()).toBe("Text");
    });

    it("should contain a type Text", () => {
        expect(arrayOfTypes[1].getName()).toBe("Text");
    });

    it("should contain an alias on type Text", () => {
        expect(theFile?.getAliases().size).toBe(NUMBER_OF_ALIASES);
        expect(Array.from(theFile?.getAliases() as Set<Alias>)[1]).toBe(arrayOfAliases[1]);
        expect(arrayOfAliases[1].getAliasedEntity()).toBe(arrayOfTypes[1]);
        expect(arrayOfAliases[1].getParentEntity()).toBe(theFile);
        expect(arrayOfTypes[1].getTypeAliases().size).toBe(1);
        expect(Array.from(arrayOfTypes[1].getTypeAliases())[0]).toBe(arrayOfAliases[1]);
    });

    it("should contain an IndexedFileAnchor", () => {
        const sourceAnchor = arrayOfAliases[1].getSourceAnchor();
        expect(sourceAnchor.constructor.name).toBe("IndexedFileAnchor");
        const indexedFileAnchor = sourceAnchor as IndexedFileAnchor;
        expect(indexedFileAnchor.getFileName().endsWith("alias.ts")).toBe(true);
        const fileAnchorText = getTextFromAnchor(indexedFileAnchor, project);
        expect(fileAnchorText).toBe(`type Text = string | { text: string };`);
    });

    // write tests for the third alias
    it("should contain an alias Callback", () => {
        expect(arrayOfAliases[2].getName()).toBe("Callback");
    });

    it("should contain a type Callback", () => {
        expect(arrayOfTypes[2].getName()).toBe("Callback");
    });

    it("should contain an alias on type Callback", () => {
        expect(theFile?.getAliases().size).toBe(NUMBER_OF_ALIASES);
        expect(Array.from(theFile?.getAliases() as Set<Alias>)[2]).toBe(arrayOfAliases[2]);
        expect(arrayOfAliases[2].getAliasedEntity()).toBe(arrayOfTypes[2]);
        expect(arrayOfAliases[2].getParentEntity()).toBe(theFile);
        expect(arrayOfTypes[2].getTypeAliases().size).toBe(1);
        expect(Array.from(arrayOfTypes[2].getTypeAliases())[0]).toBe(arrayOfAliases[2]);
    });

    it("should contain an IndexedFileAnchor", () => {
        const sourceAnchor = arrayOfAliases[2].getSourceAnchor();
        expect(sourceAnchor.constructor.name).toBe("IndexedFileAnchor");
        const indexedFileAnchor = sourceAnchor as IndexedFileAnchor;
        expect(indexedFileAnchor.getFileName().endsWith("alias.ts")).toBe(true);
        const fileAnchorText = getTextFromAnchor(indexedFileAnchor, project);
        expect(fileAnchorText).toBe(`type Callback = (data: string) => void;`);
    });
    
});
