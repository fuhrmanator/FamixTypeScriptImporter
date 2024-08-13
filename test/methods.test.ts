import { Importer } from '../src/analyze';
import { Method } from "../src/lib/famix/src/model/famix/method";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/methods.ts",
`class AAA {
    public method(): void {}
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for methods', () => {
    
    const methodList = fmxRep._getAllEntitiesWithType('Method');
    it("should have method", () => {
        expect(methodList?.size).toBe(1);
    });

    const theMethod = Array.from(methodList)[0] as Method;
    it("should contain a method 'method'", () => {
        expect(theMethod).toBeTruthy();
        expect(theMethod?.getName()).toBe('method');
    });


    it("should return void", () => {
        expect(theMethod?.declaredType.getName()).toBe("void");
    });

    it("should have no parameter", () => {
        expect(theMethod?.parameters.size).toBe(0);
    });

    it("should be a public method 'method", () => {
        expect(theMethod.getKind()).toBe(undefined);
        expect(theMethod.isAbstract).toBe(false);
        expect(theMethod.getIsClassSide()).toBe(false);
        expect(theMethod.getIsPrivate()).toBe(false);
        expect(theMethod.getIsProtected()).toBe(false);
        expect(theMethod.getIsPublic()).toBe(true);
    });
});
