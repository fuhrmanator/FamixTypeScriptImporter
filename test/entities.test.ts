import { Importer } from '../src/analyze';
import { Method, Function as FamixFunctionEntity, Variable} from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/entities.ts",
`namespace MyNamespace {
    
    class EntityClass {
        public name: string;
        private p1: boolean; // type-only private
        #p2: boolean; // runtime private
        protected prot1: Map<any, any>;
        trustMe!: string;
        readonly ro = "yes";
        static #userCount: number;
        optional?: string;
        
        constructor() {}
        public move() {}
        private move2(family: string): void {}
        #move3() {}
    }
    
    class class2 extends EntityClass {}
    
    class clsInNsp {
        public static aStaticMethod() {}
    }
}

// global scope
var globalA;
function globalFunc() {
    var aInGlobalFunc;
    function fInGlobalFunc() {
        var bInFInGlobalFunc;
    }
}

// Variable Declaration space
class Foo {};
var someVar = Foo;
`);

const fmxRep = importer.famixRepFromProject(project);
// const theEntityClass = fmxRep._getFamixClass("EntityClass");
// const theSubclass = fmxRep._getFamixClass("class2");
// const mNames = fmxRep._methodNamesAsSetFromClass("EntityClass");
const setOfVariables = Array.from(fmxRep._getAllEntitiesWithType("Variable") as Set<Variable>);

describe('Entities', () => {
    
    const theEntityClass = fmxRep._getFamixClass("{entities.ts}.MyNamespace.EntityClass[ClassDeclaration]");
    const theSubclass = fmxRep._getFamixClass("{entities.ts}.MyNamespace.class2[ClassDeclaration]");
    
    it("should contain an EntityClass", () => {
        expect(theEntityClass).toBeTruthy();
    });

    it("should contain an EntityClass with four methods", () => {
        expect(theEntityClass?.methods.size).toBe(4);
    });

    it("should contain methods with correct names", () => {
        const mNames = fmxRep._methodNamesAsSetFromClass("{entities.ts}.MyNamespace.EntityClass[ClassDeclaration]");
        expect(mNames.has("move") &&
            mNames.has("move2") &&
            mNames.has("constructor")).toBe(true);
    });

    it("should contain a private method named move2 that returns void", () => {
        if (theEntityClass) {
            const move2Method = fmxRep._getFamixMethod("{entities.ts}.MyNamespace.EntityClass.move2[MethodDeclaration]");
            expect(move2Method).toBeTruthy();
            if (move2Method) {
                expect(move2Method.isPrivate).toBe(true);
            }
        } 
    });
   
    it("should contain a private method named move2 with a signature 'private move2(family: string): void'", () => {
        if (theEntityClass) {
            const move2Method = fmxRep._getFamixMethod("{entities.ts}.MyNamespace.EntityClass.move2[MethodDeclaration]");
            expect(move2Method).toBeTruthy();
            if (move2Method) {
                expect(move2Method.signature).toBe('private move2(family: string): void');
            }
        } 
    });

    it("should contain a constructor in EntityClass", () => {
        const theConstructor = fmxRep._getFamixMethod("{entities.ts}.MyNamespace.EntityClass.constructor[Constructor]") as Method;
        expect(theConstructor).toBeTruthy();
        expect(theConstructor.kind).toBe("constructor");
    });

    it("should have a parent relationship between EntityClass and its methods", () => {
        if (theEntityClass) { 
            const mParents = fmxRep._methodParentsAsSetFromClass("{entities.ts}.MyNamespace.EntityClass[ClassDeclaration]");
            expect(mParents.size).toBe(1);
            expect(Array.from(mParents)[0]).toEqual(theEntityClass);
        }
    });

    it("should contain an EntityClass with eight attributes", () => {
        expect(theEntityClass?.properties.size).toBe(8);
    });

    it("should contain an EntityClass with an attribute named 'name' that is public", () => {
        if (theEntityClass) {
            const nameAttribute = Array.from(theEntityClass.properties)[0];
            expect(nameAttribute.name).toBe("name");
            expect(nameAttribute.visibility).toBe("public");
        }
    });

    it("should contain an EntityClass with an attribute named 'name' of type string", () => {
        if (theEntityClass) {
            expect(Array.from(theEntityClass.properties)[0].declaredType.name).toBe("string");
        }
    });

    it("should contain an EntityClass with an attribute named 'p1' that is private and of type boolean", () => {
        if (theEntityClass) {
            const p1Attribute = Array.from(theEntityClass.properties)[1];
            expect(p1Attribute.name).toBe("p1");
            expect(p1Attribute.visibility).toBe("private");
            expect(p1Attribute.declaredType.name).toBe("boolean");
        }
    });

    it("should contain an EntityClass with an attribute named '#p2' that is run-time private and of type boolean", () => {
        if (theEntityClass) {
            const p2Attribute = Array.from(theEntityClass.properties)[2];
            expect(p2Attribute.name).toBe("#p2");
            expect(p2Attribute.declaredType.name).toBe("boolean");
        }
    });

    it("should contain an EntityClass with an attribute named 'prot1' that is protected and of type Map<any, any>", () => {
        if (theEntityClass) {
            const prot1Attribute = Array.from(theEntityClass.properties)[3];
            expect(prot1Attribute.name).toBe("prot1");
            expect(prot1Attribute.visibility).toBe("protected");
            expect(prot1Attribute.declaredType.name).toBe("Map<any, any>");
        }
    });

    it("should contain an EntityClass with an attribute named 'trustMe' that is guaranteed to be there (!) and of type string", () => {
        if (theEntityClass) {
            const trustMeAttribute = Array.from(theEntityClass.properties)[4];
            expect(trustMeAttribute.name).toBe("trustMe");
            expect(trustMeAttribute.isDefinitelyAssigned).toBe(true);
            expect(trustMeAttribute.declaredType.name).toBe("string");
        }
    });

    it("should contain an EntityClass with an attribute named 'ro' that is readonly and of type \"yes\"", () => {
        if (theEntityClass) {
            const roAttribute = Array.from(theEntityClass.properties)[5];
            expect(roAttribute.name).toBe("ro");
            expect(roAttribute.readOnly).toBe(true);
            expect(roAttribute.declaredType.name).toBe('"yes"');
        }
    });

    it("should contain an EntityClass with an attribute named '#userCount' that is static and of type number", () => {
        if (theEntityClass) {
            const userCountAttribute = Array.from(theEntityClass.properties)[6];
            expect(userCountAttribute.name).toBe("#userCount");
            expect(userCountAttribute.isClassSide).toBe(true); // static
            expect(userCountAttribute.declaredType.name).toBe('number');
        }
    });

    it("should contain an EntityClass with an attribute named 'optional' that is optional (?) and of type string", () => {
        if (theEntityClass) {
            const userCountAttribute = Array.from(theEntityClass.properties)[7];
            expect(userCountAttribute.name).toBe("optional");
            expect(userCountAttribute.isOptional).toBe(true);
            expect(userCountAttribute.declaredType.name).toBe('string');
        }
    });

    it("should contain an EntityClass with one subclass", () => {
        expect(Array.from(theEntityClass!.subInheritances).length).toBe(1);
    });

    it("should contain an EntityClass with one subclass named 'class2'", () => {
        const theClassSubclass = Array.from(theEntityClass!.subInheritances)[0].subclass;
        expect(theClassSubclass.name).toBe("class2");
        if (theSubclass) {
            expect(theSubclass).toBe(theClassSubclass);
        }
    });

    it("should contain a clsInNsp with a class-side method named 'aStaticMethod'", () => {
        const clsInNSP = fmxRep._getFamixClass("{entities.ts}.MyNamespace.clsInNsp[ClassDeclaration]");
        expect(clsInNSP).toBeTruthy();
        const aStaticMethod = Array.from(clsInNSP!.methods).find(m => m.name === 'aStaticMethod');
        expect(aStaticMethod).toBeTruthy();
        expect(aStaticMethod!.isClassSide).toBe(true);
    });

    it("should contain a private method named '#move3'", () => {
        const cls = fmxRep._getFamixClass("{entities.ts}.MyNamespace.EntityClass[ClassDeclaration]");
        expect(cls).toBeTruthy();
        const aMethod = Array.from(cls!.methods).find(m => m.name === '#move3');
        expect(aMethod).toBeTruthy();
        expect(aMethod!.isPrivate).toBe(true);
        expect(aMethod!.isProtected).toBe(false);
        expect(aMethod!.isPublic).toBe(false);
        expect(aMethod!.isClassSide).toBe(false);
    });

    // global scope
    it("should contain a function 'globalFunc' with global scope", () => {
        const globalFunc = fmxRep._getFamixFunction('{entities.ts}.globalFunc[FunctionDeclaration]') as FamixFunctionEntity;
        expect(globalFunc).toBeTruthy();
        expect(globalFunc.name).toBe('globalFunc');
        expect(globalFunc.parentContainerEntity.name).toBe('entities.ts');
    });

    it("should contain a variable 'globalA'", () => {
        expect(setOfVariables).toBeTruthy();
        const globalVar = setOfVariables.find(p => p.name === "globalA");
        expect(globalVar).toBeTruthy();
    });

    it("should contain a variable 'aInGlobalFunc' contained in 'globalFunc'", () => {
        expect(setOfVariables).toBeTruthy();
        const globalVar = setOfVariables.find(p => p.name === "aInGlobalFunc");
        expect(globalVar).toBeTruthy();
        expect(globalVar?.parentContainerEntity.name).toBe('globalFunc');
        expect(globalVar?.getJSON()).toMatch(/"parentBehaviouralEntity":{"ref":\d+}/);  // parentBehaviouralEntity is the name used in the Trait in Famix -- it is the parent container
    });

    it("should contain a variable 'bInFInGlobalFunc' contained in 'fInGlobalFunc'", () => {
        expect(setOfVariables).toBeTruthy();
        const globalVar = setOfVariables.find(p => p.name === "bInFInGlobalFunc");
        expect(globalVar).toBeTruthy();
        expect(globalVar?.parentContainerEntity.name).toBe('fInGlobalFunc');
        expect(globalVar?.getJSON()).toMatch(/"parentBehaviouralEntity":{"ref":\d+}/);  // parentBehaviouralEntity is the name used in the Trait in Famix -- it is the parent container
    });

    it("should contain a variable 'someVar' contained in the global scope", () => {
        expect(setOfVariables).toBeTruthy();
        const globalVar = setOfVariables.find(p => p.name === "someVar");
        expect(globalVar).toBeTruthy();
        expect(globalVar?.parentContainerEntity.name).toBe('entities.ts');
        expect(globalVar?.getJSON()).toMatch(/"parentBehaviouralEntity":{"ref":\d+}/);  // parentBehaviouralEntity is the name used in the Trait in Famix -- it is the parent container
    });

    // the type of someVar is Foo
    it("should contain a variable 'someVar' with type Foo", () => {
        expect(setOfVariables).toBeTruthy();
        const someVar = setOfVariables.find(p => p.name === "someVar");
        expect(someVar).toBeTruthy();
        expect(someVar?.declaredType.name).toBe('typeof Foo');
    });
});
