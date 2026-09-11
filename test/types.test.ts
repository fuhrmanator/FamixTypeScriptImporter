import { Importer } from '../src/analyze';
import { TypeParameter } from '../src/lib/famix/model/famix/type_parameter';
import { PrimitiveType } from '../src/lib/famix/model/famix/primitive_type';
import { Type } from '../src/lib/famix/model/famix/type';
import { IndexedFileAnchor } from '../src/lib/famix/model/famix';
import { project, exportProjectSourceFilesForEndtoEndPharoTests } from './testUtils';

const importer = new Importer();
project.createSourceFile("types.ts",
`const aString: string = "one";
const aBoolean: boolean = false;
const aNumber: number = 3;
const aNull: null = null;
const anUnknown: unknown = 5;
const anAny: any = 6;
declare const aUniqueSymbol: unique symbol = Symbol("seven");
let aNever: never; // note that const eight: never cannot happen as we cannot instantiate a never
// See Theo Despoudis. TypeScript 4 Design Patterns and Best Practices (Kindle Locations 514-520). Packt Publishing Pvt Ltd.
const aBigint: bigint = 9n;
const aVoid: void = undefined;
const aSymbol: symbol = Symbol("ten");
const anUndefined: undefined = undefined;
class A {};
let a = new A();
// let b: Map<any, boolean>;
class B<T> {};
let bb: B<number>;
`);

exportProjectSourceFilesForEndtoEndPharoTests(project, __filename);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for types', () => {

    const types = Array.from(fmxRep._getAllEntitiesWithType("Type") as Set<Type>);
    const primitiveTypes = Array.from(fmxRep._getAllEntitiesWithType("PrimitiveType") as Set<PrimitiveType>);
    const typeParameters = Array.from(fmxRep._getAllEntitiesWithType("TypeParameter") as Set<TypeParameter>);
    const theTypeParameter = typeParameters.find(t => t.name === "T");
    const theBaseType = types.find(t => t.name === "Map");
    const theFile = fmxRep._getFamixFile("types.ts");
    const theAnyType = primitiveTypes.find(t => t.name === "any");
    const theBooleanType = primitiveTypes.find(t => t.name === "boolean");
    const theStringType = primitiveTypes.find(t => t.name === "string");
    const theNumberType = primitiveTypes.find(t => t.name === "number");
    const theNullType = primitiveTypes.find(t => t.name === "null");
    const theUndefinedType = primitiveTypes.find(t => t.name === "undefined");
    const theUnknownType = primitiveTypes.find(t => t.name === "unknown");
    const theNeverType = primitiveTypes.find(t => t.name === "never");
    const theUniqueType = primitiveTypes.find(t => t.name === "unique symbol"); // can't find this, it's just "symbol" normally, despite https://www.typescriptlang.org/docs/handbook/symbols.html#unique-symbol
    const theBigintType = primitiveTypes.find(t => t.name === "bigint");
    const theVoidType = primitiveTypes.find(t => t.name === "void");
    const theSymbolType = primitiveTypes.find(t => t.name === "symbol");

    it("should contain all the primitive types: string, boolean, void, number, null, undefined, unknown, never, symbol, unique symbol, bigint, any", () => {
        primitiveTypes.forEach(t => {console.info(t.name);});
        expect(primitiveTypes.length).toBe(12); // not 12, because unique symbol is not found
        expect(theStringType).toBeTruthy();
        expect(theBooleanType).toBeTruthy();
        expect(theVoidType).toBeTruthy();
        expect(theNumberType).toBeTruthy();
        expect(theNullType).toBeTruthy();
        expect(theUndefinedType).toBeTruthy();
        expect(theUnknownType).toBeTruthy();
        expect(theNeverType).toBeTruthy();
        // below fails in ts-morph 19.0.0, see https://github.com/dsherret/ts-morph/issues/1453
        expect(theUniqueType).toBeTruthy(); // this should be true, but it's not found
        expect(theBigintType).toBeTruthy();
        expect(theAnyType).toBeTruthy();
        expect(theSymbolType).toBeTruthy();
    });

    it("should contain a variable 'a' of type 'A'", () => {
        const aVariable = fmxRep._getFamixVariable("{types.ts}.a[VariableDeclaration]");
        expect(aVariable).toBeTruthy();
        expect(aVariable?.typing?.declaredType).toBeTruthy();
        expect(aVariable?.typing?.declaredType?.name).toBe("A");
    });

    it("should contain a parameterized type 'T' from 'class B<T>'", () => {
        expect(typeParameters.length).toBe(1);
        expect(typeParameters.find(t => t.name === "T")).toBeTruthy();
    });

    it("should have B for base type of B<T>", () => {
        expect(theTypeParameter?.baseType).toBe(theBaseType);
    });

    it("should have types.ts for container", () => {
        expect(types[0].container).toBe(theFile);
    });

    it("should have an IndexedFileAnchor with a filename of 'types.ts' for B<T>", () => {
        const indexedFileAnchor = theTypeParameter?.sourceAnchor;
        expect(indexedFileAnchor).toBeTruthy();
        expect((indexedFileAnchor as IndexedFileAnchor).fileName.endsWith("types.ts")).toBe(true);
    });

});
