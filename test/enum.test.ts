import { Importer } from '../src/analyze';
import { Access } from '../src/lib/famix/model/famix/access';
import { Enum } from '../src/lib/famix/model/famix/enum';
import { ScriptEntity } from '../src/lib/famix/model/famix/script_entity';
import { IndexedFileAnchor } from '../src/lib/famix/model/famix/indexed_file_anchor';
import { getCommentTextFromCommentViaAnchor } from './testUtils';
import { project } from './testUtils';

// TODO: ⏳ Review if the test is still in a sync with a current solution.
//       🛠️ Fix code to pass the tests and remove .skip

const importer = new Importer();
// logger.settings.minLevel = 0;   // see all messages in testing

project.createSourceFile("/enum.ts",
`// comment before
enum Weekday {
    // just another manic Monday
    MONDAY = "Monday",
    TUESDAY = "Tuesday",
    WEDNESDAY = "Wednesday",
    THURSDAY = "Thursday",
    FRIDAY = "Friday",
    SATURDAY = "Saturday",
    SUNDAY = "Sunday"
}

const aDay: Weekday = Weekday.MONDAY;
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for enum', () => {
    
    const theFile = Array.from(fmxRep._getAllEntitiesWithType("ScriptEntity") as Set<ScriptEntity>)[0];
    const enumSet = fmxRep._getAllEntitiesWithType("Enum") as Set<Enum>;
    const enumArray = Array.from(enumSet);

    it("should contain an enum with a comment before it.", () => {
        const theEnum = Array.from(enumSet)[0];
        expect(theEnum).toBeDefined();
        expect(theEnum.comments.size).toBe(1);
        const comment = Array.from(theEnum.comments)[0];
        expect(getCommentTextFromCommentViaAnchor(comment, project)).toBe("// comment before");
        expect((comment.sourceAnchor as IndexedFileAnchor).fileName.endsWith("enum.ts")).toBe(true);
        });

    it("should contain one enum with seven enum values", () => {
        expect(enumSet.size).toBe(1);
        const theEnum = enumArray[0];
        expect(theFile.types.has(theEnum)).toBe(true);
        expect(theEnum.name).toBe("Weekday");
        const enumValuesArray = Array.from(theEnum.values);
        expect(enumValuesArray.length).toBe(7);
        expect(enumValuesArray[0].name).toBe("MONDAY");
        expect(enumValuesArray[1].name).toBe("TUESDAY");
        expect(enumValuesArray[2].name).toBe("WEDNESDAY");
        expect(enumValuesArray[3].name).toBe("THURSDAY");
        expect(enumValuesArray[4].name).toBe("FRIDAY");
        expect(enumValuesArray[5].name).toBe("SATURDAY");
        expect(enumValuesArray[6].name).toBe("SUNDAY");
        expect(enumValuesArray[0].parentEntity).toBe(theEnum);
        expect(enumValuesArray[1].parentEntity).toBe(theEnum);
        expect(enumValuesArray[2].parentEntity).toBe(theEnum);
        expect(enumValuesArray[3].parentEntity).toBe(theEnum);
        expect(enumValuesArray[4].parentEntity).toBe(theEnum);
        expect(enumValuesArray[5].parentEntity).toBe(theEnum);
        expect(enumValuesArray[6].parentEntity).toBe(theEnum);
    });
    
    it.skip("should contain one access", () => {
        expect(fmxRep._getAllEntitiesWithType("Access").size).toBe(1);
        const theAccess = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>)[0];
        expect(theFile.accesses.has(theAccess)).toBe(true);
        expect(theAccess.accessor.name).toBe("enum.ts");
        expect(theAccess.variable.name).toBe("MONDAY");
    });    
});
