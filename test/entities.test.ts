import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Method, Function as FamixFunctionEntity, Variable} from '../src/lib/famix/src/model/famix';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: ""
        },
        useInMemoryFileSystem: true,
    }
);

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
        expect(theEntityClass?.getMethods().size).toBe(4);
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
                expect(move2Method.getIsPrivate()).toBe(true);
            }
        } 
    });
   
    it("should contain a private method named move2 with a signature 'private move2(family: string): void'", () => {
        if (theEntityClass) {
            const move2Method = fmxRep._getFamixMethod("{entities.ts}.MyNamespace.EntityClass.move2[MethodDeclaration]");
            expect(move2Method).toBeTruthy();
            if (move2Method) {
                expect(move2Method.getSignature()).toBe('private move2(family: string): void');
            }
        } 
    });

    it("should contain a constructor in EntityClass", () => {
        const theConstructor = fmxRep._getFamixMethod("{entities.ts}.MyNamespace.EntityClass.constructor[Constructor]") as Method;
        expect(theConstructor).toBeTruthy();
        expect(theConstructor.getKind()).toBe("constructor");
    });

    it("should have a parent relationship between EntityClass and its methods", () => {
        if (theEntityClass) { 
            const mParents = fmxRep._methodParentsAsSetFromClass("{entities.ts}.MyNamespace.EntityClass[ClassDeclaration]");
            expect(mParents.size).toBe(1);
            expect(Array.from(mParents)[0]).toEqual(theEntityClass);
        }
    });

    it("should contain an EntityClass with eight attributes", () => {
        expect(theEntityClass?.getProperties().size).toBe(8);
    });

    it("should contain an EntityClass with an attribute named 'name' that is public", () => {
        if (theEntityClass) {
            const nameAttribute = Array.from(theEntityClass.getProperties())[0];
            expect(nameAttribute.getName()).toBe("name");
            expect(nameAttribute.visibility).toBe("public");
        }
    });

    it("should contain an EntityClass with an attribute named 'name' of type string", () => {
        if (theEntityClass) {
            expect(Array.from(theEntityClass.getProperties())[0].getDeclaredType().getName()).toBe("string");
        }
    });

    it("should contain an EntityClass with an attribute named 'p1' that is private and of type boolean", () => {
        if (theEntityClass) {
            const p1Attribute = Array.from(theEntityClass.getProperties())[1];
            expect(p1Attribute.getName()).toBe("p1");
            expect(p1Attribute.visibility).toBe("private");
            expect(p1Attribute.getDeclaredType().getName()).toBe("boolean");
        }
    });

    it("should contain an EntityClass with an attribute named '#p2' that is run-time private and of type boolean", () => {
        if (theEntityClass) {
            const p2Attribute = Array.from(theEntityClass.getProperties())[2];
            expect(p2Attribute.getName()).toBe("#p2");
            expect(p2Attribute.getDeclaredType().getName()).toBe("boolean");
        }
    });

    it("should contain an EntityClass with an attribute named 'prot1' that is protected and of type Map<any, any>", () => {
        if (theEntityClass) {
            const prot1Attribute = Array.from(theEntityClass.getProperties())[3];
            expect(prot1Attribute.getName()).toBe("prot1");
            expect(prot1Attribute.visibility).toBe("protected");
            expect(prot1Attribute.getDeclaredType().getName()).toBe("Map<any, any>");
        }
    });

    it("should contain an EntityClass with an attribute named 'trustMe' that is guaranteed to be there (!) and of type string", () => {
        if (theEntityClass) {
            const trustMeAttribute = Array.from(theEntityClass.getProperties())[4];
            expect(trustMeAttribute.getName()).toBe("trustMe");
            expect(trustMeAttribute.getModifiers()).toContain("!");
            expect(trustMeAttribute.getDeclaredType().getName()).toBe("string");
        }
    });

    it("should contain an EntityClass with an attribute named 'ro' that is readonly and of type \"yes\"", () => {
        if (theEntityClass) {
            const roAttribute = Array.from(theEntityClass.getProperties())[5];
            expect(roAttribute.getName()).toBe("ro");
            expect(roAttribute.readOnly).toBe(true);
            expect(roAttribute.getDeclaredType().getName()).toBe('"yes"');
        }
    });

    it("should contain an EntityClass with an attribute named '#userCount' that is static and of type number", () => {
        if (theEntityClass) {
            const userCountAttribute = Array.from(theEntityClass.getProperties())[6];
            expect(userCountAttribute.getName()).toBe("#userCount");
            expect(userCountAttribute.getIsClassSide()).toBe(true); // static
            expect(userCountAttribute.getDeclaredType().getName()).toBe('number');
        }
    });

    it("should contain an EntityClass with an attribute named 'optional' that is optional (?) and of type string", () => {
        if (theEntityClass) {
            const userCountAttribute = Array.from(theEntityClass.getProperties())[7];
            expect(userCountAttribute.getName()).toBe("optional");
            expect(userCountAttribute.getModifiers()).toContain("?");
            expect(userCountAttribute.getDeclaredType().getName()).toBe('string');
        }
    });

    it("should contain an EntityClass with one subclass", () => {
        expect(Array.from(theEntityClass!.getSubInheritances()).length).toBe(1);
    });

    it("should contain an EntityClass with one subclass named 'class2'", () => {
        const theClassSubclass = Array.from(theEntityClass!.getSubInheritances())[0].getSubclass();
        expect(theClassSubclass.getName()).toBe("class2");
        if (theSubclass) {
            expect(theSubclass).toBe(theClassSubclass);
        }
    });

    it("should contain a clsInNsp with a class-side method named 'aStaticMethod'", () => {
        const clsInNSP = fmxRep._getFamixClass("{entities.ts}.MyNamespace.clsInNsp[ClassDeclaration]");
        expect(clsInNSP).toBeTruthy();
        const aStaticMethod = Array.from(clsInNSP!.getMethods()).find(m => m.getName() === 'aStaticMethod');
        expect(aStaticMethod).toBeTruthy();
        expect(aStaticMethod!.getIsClassSide()).toBe(true);
    });

    it("should contain a private method named '#move3'", () => {
        const cls = fmxRep._getFamixClass("{entities.ts}.MyNamespace.EntityClass[ClassDeclaration]");
        expect(cls).toBeTruthy();
        const aMethod = Array.from(cls!.getMethods()).find(m => m.getName() === '#move3');
        expect(aMethod).toBeTruthy();
        expect(aMethod!.getIsPrivate()).toBe(true);
        expect(aMethod!.getIsProtected()).toBe(false);
        expect(aMethod!.getIsPublic()).toBe(false);
        expect(aMethod!.getIsClassSide()).toBe(false);
    });

    // global scope
    it("should contain a function 'globalFunc' with global scope", () => {
        const globalFunc = fmxRep._getFamixFunction('{entities.ts}.globalFunc[FunctionDeclaration]') as FamixFunctionEntity;
        expect(globalFunc).toBeTruthy();
        expect(globalFunc.getName()).toBe('globalFunc');
        expect(globalFunc.getParentContainerEntity().getName()).toBe('entities.ts');
    });

    it("should contain a variable 'globalA'", () => {
        expect(setOfVariables).toBeTruthy();
        const globalVar = setOfVariables.find(p => p.getName() === "globalA");
        expect(globalVar).toBeTruthy();
    });

    it("should contain a variable 'aInGlobalFunc' contained in 'globalFunc'", () => {
        expect(setOfVariables).toBeTruthy();
        const globalVar = setOfVariables.find(p => p.getName() === "aInGlobalFunc");
        expect(globalVar).toBeTruthy();
        expect(globalVar?.getParentContainerEntity().getName()).toBe('globalFunc');
        expect(globalVar?.getJSON()).toMatch(/"parentBehaviouralEntity":{"ref":\d+}/);  // parentBehaviouralEntity is the name used in the Trait in Famix -- it is the parent container
    });

    it("should contain a variable 'bInFInGlobalFunc' contained in 'fInGlobalFunc'", () => {
        expect(setOfVariables).toBeTruthy();
        const globalVar = setOfVariables.find(p => p.getName() === "bInFInGlobalFunc");
        expect(globalVar).toBeTruthy();
        expect(globalVar?.getParentContainerEntity().getName()).toBe('fInGlobalFunc');
        expect(globalVar?.getJSON()).toMatch(/"parentBehaviouralEntity":{"ref":\d+}/);  // parentBehaviouralEntity is the name used in the Trait in Famix -- it is the parent container
    });

    it("should contain a variable 'someVar' contained in the global scope", () => {
        expect(setOfVariables).toBeTruthy();
        const globalVar = setOfVariables.find(p => p.getName() === "someVar");
        expect(globalVar).toBeTruthy();
        expect(globalVar?.getParentContainerEntity().getName()).toBe('entities.ts');
        expect(globalVar?.getJSON()).toMatch(/"parentBehaviouralEntity":{"ref":\d+}/);  // parentBehaviouralEntity is the name used in the Trait in Famix -- it is the parent container
    });

    // the type of someVar is Foo
    it("should contain a variable 'someVar' with type Foo", () => {
        expect(setOfVariables).toBeTruthy();
        const someVar = setOfVariables.find(p => p.getName() === "someVar");
        expect(someVar).toBeTruthy();
        expect(someVar?.getDeclaredType().getName()).toBe('typeof Foo');
    });
});
