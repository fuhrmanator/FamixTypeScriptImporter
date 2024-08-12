import { Importer, logger } from '../src/analyze';
import { Access } from '../src/lib/famix/src/model/famix/access';
import { Enum } from '../src/lib/famix/src/model/famix/enum';
import { ScriptEntity } from '../src/lib/famix/src/model/famix/script_entity';
import { IndexedFileAnchor } from '../src/lib/famix/src/model/famix/indexed_file_anchor';
import { getCommentTextFromCommentViaAnchor } from './testUtils';
import { project } from './testUtils';

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
        expect(theEnum.getComments().size).toBe(1);
        const comment = Array.from(theEnum.getComments())[0];
        expect(getCommentTextFromCommentViaAnchor(comment, project)).toBe("// comment before");
        expect((comment.getSourceAnchor() as IndexedFileAnchor).getFileName().endsWith("enum.ts")).toBe(true);
        });

    it("should contain one enum with seven enum values", () => {
        expect(enumSet.size).toBe(1);
        const theEnum = enumArray[0];
        expect(theFile.getTypes().has(theEnum)).toBe(true);
        expect(theEnum.getName()).toBe("Weekday");
        const enumValuesArray = Array.from(theEnum.getValues());
        expect(enumValuesArray.length).toBe(7);
        expect(enumValuesArray[0].getName()).toBe("MONDAY");
        expect(enumValuesArray[1].getName()).toBe("TUESDAY");
        expect(enumValuesArray[2].getName()).toBe("WEDNESDAY");
        expect(enumValuesArray[3].getName()).toBe("THURSDAY");
        expect(enumValuesArray[4].getName()).toBe("FRIDAY");
        expect(enumValuesArray[5].getName()).toBe("SATURDAY");
        expect(enumValuesArray[6].getName()).toBe("SUNDAY");
        expect(enumValuesArray[0].getParentEntity()).toBe(theEnum);
        expect(enumValuesArray[1].getParentEntity()).toBe(theEnum);
        expect(enumValuesArray[2].getParentEntity()).toBe(theEnum);
        expect(enumValuesArray[3].getParentEntity()).toBe(theEnum);
        expect(enumValuesArray[4].getParentEntity()).toBe(theEnum);
        expect(enumValuesArray[5].getParentEntity()).toBe(theEnum);
        expect(enumValuesArray[6].getParentEntity()).toBe(theEnum);
    });
    
    it("should contain one access", () => {
        expect(fmxRep._getAllEntitiesWithType("Access").size).toBe(1);
        const theAccess = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>)[0];
        expect(theFile.getAccesses().has(theAccess)).toBe(true);
        expect(theAccess.getAccessor().getName()).toBe("enum.ts");
        expect(theAccess.getVariable().getName()).toBe("MONDAY");
    });    
});
