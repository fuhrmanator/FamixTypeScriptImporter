import { FamixBaseElement, ImportClause, Inheritance, Module, NamedEntity, ScriptEntity } from "../../src";
import { FamixRepository } from "../../src";
import { Class, PrimitiveType } from "../../src";

const namedEntityCompareFunction = (actual: FamixBaseElement, expected: FamixBaseElement) => {
    const actualAsNamedEntity = actual as NamedEntity;
    const expectedAsNamedEntity = expected as NamedEntity;

    return actualAsNamedEntity.fullyQualifiedName === expectedAsNamedEntity.fullyQualifiedName &&
        actualAsNamedEntity.incomingImports.size === expectedAsNamedEntity.incomingImports.size &&
        actualAsNamedEntity.isStub === expectedAsNamedEntity.isStub;
};

const classCompareFunction = (actual: FamixBaseElement, expected: FamixBaseElement) => {
    const actualAsClass = actual as Class;
    const expectedAsClass = expected as Class;
    
    return namedEntityCompareFunction(actualAsClass, expectedAsClass) &&
        actualAsClass.subInheritances.size === expectedAsClass.subInheritances.size &&
        actualAsClass.superInheritances.size === expectedAsClass.superInheritances.size;
    // TODO: add more properties to compare
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const primitiveTypeCompareFunction = (actual: FamixBaseElement, expected: FamixBaseElement) => {
    const actualAsPrimitiveType = actual as PrimitiveType;
    const expectedAsPrimitiveType = expected as PrimitiveType;
    
    return actualAsPrimitiveType.fullyQualifiedName === expectedAsPrimitiveType.fullyQualifiedName;
};

const inheritanceCompareFunction = (actual: FamixBaseElement, expected: FamixBaseElement) => {
    const actualAsInheritance = actual as Inheritance;
    const expectedAsInheritance = expected as Inheritance;

    return namedEntityCompareFunction(actualAsInheritance.superclass, expectedAsInheritance.superclass) &&
    namedEntityCompareFunction(actualAsInheritance.subclass, expectedAsInheritance.subclass) &&
        actualAsInheritance.superclass.subInheritances.size === expectedAsInheritance.superclass.subInheritances.size &&
        actualAsInheritance.subclass.superInheritances.size === expectedAsInheritance.subclass.superInheritances.size;
};

const importClauseCompareFunction = (actual: FamixBaseElement, expected: FamixBaseElement) => {
    const actualAsImportClause = actual as ImportClause;
    const expectedAsImportClause = expected as ImportClause;

    return actualAsImportClause.fullyQualifiedName === expectedAsImportClause.fullyQualifiedName &&
        actualAsImportClause.importingEntity.incomingImports.size === expectedAsImportClause.importingEntity.incomingImports.size &&
        actualAsImportClause.importedEntity.incomingImports.size === expectedAsImportClause.importedEntity.incomingImports.size;
};

const moduleCompareFunction = (actual: FamixBaseElement, expected: FamixBaseElement) => {
    const actualAsModule = actual as Module;
    const expectedAsModule = expected as Module;

    return scriptEntityCompareFunction(actualAsModule, expectedAsModule) &&
        actualAsModule.isAmbient === expectedAsModule.isAmbient &&
        actualAsModule.isNamespace === expectedAsModule.isNamespace &&
        actualAsModule.isModule === expectedAsModule.isModule &&
        actualAsModule.parentScope?.fullyQualifiedName === expectedAsModule.parentScope?.fullyQualifiedName;
};

const scriptEntityCompareFunction = (actual: FamixBaseElement, expected: FamixBaseElement) => {
    const actualAsScriptEntity = actual as ScriptEntity;
    const expectedAsScriptEntity = expected as ScriptEntity;

    return namedEntityCompareFunction(actualAsScriptEntity, expectedAsScriptEntity) &&
        actualAsScriptEntity.numberOfLinesOfText === expectedAsScriptEntity.numberOfLinesOfText &&
        actualAsScriptEntity.numberOfCharacters === expectedAsScriptEntity.numberOfCharacters;
};

export const expectRepositoriesToHaveSameStructure = (actual: FamixRepository, expected: FamixRepository) => {
    // TODO: use the expectElementsToBeSame for more types
    // TODO: test cyclomatic complexity
    expectElementsToBeEqualSize(actual, expected, "Access");
    expectElementsToBeEqualSize(actual, expected, "Accessor");
    expectElementsToBeEqualSize(actual, expected, "Alias");
    expectElementsToBeEqualSize(actual, expected, "ArrowFunction");
    expectElementsToBeEqualSize(actual, expected, "BehaviorEntity");
    expectElementsToBeEqualSize(actual, expected, "Class");
    expectElementsToBeSame(actual, expected, "Class", classCompareFunction);
    expectElementsToBeEqualSize(actual, expected, "Comment");
    expectElementsToBeEqualSize(actual, expected, "Concretisation");
    expectElementsToBeEqualSize(actual, expected, "ContainerEntity");
    expectElementsToBeEqualSize(actual, expected, "Decorator");
    expectElementsToBeEqualSize(actual, expected, "Entity");
    expectElementsToBeEqualSize(actual, expected, "EnumValue");
    expectElementsToBeEqualSize(actual, expected, "Enum");
    expectElementsToBeEqualSize(actual, expected, "Function");
    expectElementsToBeEqualSize(actual, expected, "ImportClause");
    expectElementsToBeSame(actual, expected, "ImportClause", importClauseCompareFunction);
    expectElementsToBeEqualSize(actual, expected, "IndexedFileAnchor");
    expectElementsToBeEqualSize(actual, expected, "Inheritance");
    expectElementsToBeSame(actual, expected, "Inheritance", inheritanceCompareFunction);
    expectElementsToBeEqualSize(actual, expected, "Interface");
    expectElementsToBeEqualSize(actual, expected, "Invocation");
    expectElementsToBeEqualSize(actual, expected, "Method");
    expectElementsToBeEqualSize(actual, expected, "Module");
    expectElementsToBeSame(actual, expected, "Module", moduleCompareFunction);
    expectElementsToBeEqualSize(actual, expected, "NamedEntity");
    expectElementsToBeSame(actual, expected, "NamedEntity", namedEntityCompareFunction);
    expectElementsToBeEqualSize(actual, expected, "ParameterConcretisation");
    expectElementsToBeEqualSize(actual, expected, "ParameterType");
    expectElementsToBeEqualSize(actual, expected, "Parameter");
    expectElementsToBeEqualSize(actual, expected, "ParametricArrowFunction");
    expectElementsToBeEqualSize(actual, expected, "ParametricClass");
    expectElementsToBeEqualSize(actual, expected, "ParametricFunction");
    expectElementsToBeEqualSize(actual, expected, "ParametricInterface");
    expectElementsToBeEqualSize(actual, expected, "ParametricMethod");
    // NOTE: for now when we removing the entity we don't remove the primitive type so for now they are accumulating
    // expectElementsToBeEqualSize(actual, expected, "PrimitiveType");
    // expectElementsToBeSame(actual, expected, "PrimitiveType", primitiveTypeCompareFunction);
    expectElementsToBeEqualSize(actual, expected, "Property");
    expectElementsToBeEqualSize(actual, expected, "Reference");
    expectElementsToBeEqualSize(actual, expected, "ScopingEntity");
    expectElementsToBeEqualSize(actual, expected, "ScriptEntity");
    expectElementsToBeSame(actual, expected, "ScriptEntity", scriptEntityCompareFunction);
    expectElementsToBeEqualSize(actual, expected, "SourceAnchor");
    expectElementsToBeEqualSize(actual, expected, "SourceLanguage");
    expectElementsToBeEqualSize(actual, expected, "SourcedEntity");
    expectElementsToBeEqualSize(actual, expected, "StructuralEntity");
    expectElementsToBeEqualSize(actual, expected, "Type");
    expectElementsToBeEqualSize(actual, expected, "Variable");

    // NOTE: for now when we removing the entity we don't remove the primitive type so for now they are accumulating
    // expect(actual._getAllEntities().size).toEqual(expected._getAllEntities().size);
};

const expectElementsToBeEqualSize = (actual: FamixRepository, expected: FamixRepository, type: string) => {
    const actualEntities = actual._getAllEntitiesWithType(type);
    const expectedEntities = expected._getAllEntitiesWithType(type);
    expect(actualEntities.size).toEqual(expectedEntities.size);
};

const expectElementsToBeSame = (
    actual: FamixRepository, 
    expected: FamixRepository, 
    type: string, 
    compareFunction: (actual: FamixBaseElement, expected: FamixBaseElement) => boolean
) => {
    const actualEntities = actual._getAllEntitiesWithType(type);
    const expectedEntities = expected._getAllEntitiesWithType(type);
    
    for (const actualEntity of actualEntities) {
        const expectedEntity = Array.from(expectedEntities).find(entity => 
            compareFunction(actualEntity, entity)
        );
        expect(expectedEntity).toBeDefined();
    }
};
