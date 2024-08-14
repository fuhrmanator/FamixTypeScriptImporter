import { Importer } from '../src/analyze';
import { ScriptEntity, Class, PrimitiveType, Method, Parameter, Comment, Access, Variable, Function } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/famixMorphObject.ts",
`
class Class1 {
    public returnHi(): string {
        return "Hi";
    }

    m(param /* any */) /* void */ {
        var z = param; 
        console.log(b); // b is in global scope
    }
}

function a() {}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for famix objects and ts-morph objects', () => {

    it("should contain 12 elements", () => {
        expect(fmxRep.getFmxElementObjectMap().size).toBe(12);
    });

    // 0 = ScriptEntity
    it("should contain a ScriptEntity", () => {
        const scripts = fmxRep._getAllEntitiesWithType("ScriptEntity") as Set<ScriptEntity>;
        expect(scripts.size).toBe(1);
        const script = scripts.values().next().value;
        expect(script.name).toBe("famixMorphObject.ts");
    });
    // 1 = Class
    it("should contain a Class1", () => {
        const classes = fmxRep._getAllEntitiesWithType("Class") as Set<Class>;
        expect(classes.size).toBe(1);
        const class1 = classes.values().next().value;
        expect(class1.name).toBe("Class1");
    });

    // 2, 4, 6 = PrimitiveType
    it("should contain three PrimitiveType: string, void, any", () => {
        const primitiveTypes = fmxRep._getAllEntitiesWithType("PrimitiveType") as Set<PrimitiveType>;
        expect(primitiveTypes.size).toBe(3);
        const primitiveTypesIterator = primitiveTypes.values();
        const firstPrimitiveType = primitiveTypesIterator.next().value;
        expect(firstPrimitiveType.name).toBe("string");
        const secondPrimitiveType = primitiveTypesIterator.next().value;
        expect(secondPrimitiveType.name).toBe("void");
        const thirdPrimitiveType = primitiveTypesIterator.next().value;
        expect(thirdPrimitiveType.name).toBe("any");
    });
    // 3, 5 = Method
    it("should contain two methods: returnHi, m", () => {
        const methods = fmxRep._getAllEntitiesWithType("Method") as Set<Method>;
        expect(methods.size).toBe(2);
        const methodsIterator = methods.values();
        const firstMethod = methodsIterator.next().value;
        expect(firstMethod.name).toBe("returnHi");
        const secondMethod = methodsIterator.next().value;
        expect(secondMethod.name).toBe("m");
    });
    // 7 = Parameter
    it("should contain a parameter named param", () => {
        const parameters = fmxRep._getAllEntitiesWithType("Parameter") as Set<Parameter>;
        expect(parameters.size).toBe(1);
        const parameter = parameters.values().next().value;
        expect(parameter.name).toBe("param");
    });
    // 8 = Comment
    it("should contain a comment", () => {
        const comments = fmxRep._getAllEntitiesWithType("Comment") as Set<Comment>;
        expect(comments.size).toBe(1);
        // Comment is in sourceAnchor, outside of this test's scope
    });
    // 9 = Variable
    it("should contain a variable named z", () => {
        const variables = fmxRep._getAllEntitiesWithType("Variable") as Set<Variable>;
        expect(variables.size).toBe(1);
        const variable = variables.values().next().value;
        expect(variable.name).toBe("z");
    });
    // 10 = Function
    it("should contain a function named a", () => {
        const functions = fmxRep._getAllEntitiesWithType("Function") as Set<Function>;
        expect(functions.size).toBe(1);
        const aFunction = functions.values().next().value;
        expect(aFunction.name).toBe("a");
    });
    // 11 = Access
    it("should contain an access", () => {
        const accesses = fmxRep._getAllEntitiesWithType("Access") as Set<Access>;
        expect(accesses.size).toBe(1);
        const access: Access = accesses.values().next().value;
        expect(access.variable.name).toBe("param");
    });
});
