import { Importer } from '../src/analyze';
import { Method, Function } from "../src/lib/famix/model/famix";
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/fmxRep.ts",
`class Class1 {
    public returnHi(): string {
        return "Hi";
    }
}

      export function a(c: Class1) {
        return () => (c.returnHi());
      }
`);

const fmxRep = importer.famixRepFromProject(project);

describe('FamixRep getFamixEntityByFullyQualifiedName() functionality', () => {

    it(`should return the method entity for 'Class1.returnHi'`, () => {
        const methodEntity = fmxRep.getFamixEntityByFullyQualifiedName("{fmxRep.ts}.Class1.returnHi[MethodDeclaration]");
        expect(methodEntity).toBeInstanceOf(Method);
    });

    it(`should return the function entity for 'a'`, () => {
        const methodEntity = fmxRep.getFamixEntityByFullyQualifiedName("{fmxRep.ts}.a[FunctionDeclaration]");
        expect(methodEntity).toBeInstanceOf(Function);
    });

});
