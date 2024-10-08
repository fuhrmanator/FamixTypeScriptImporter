import { Importer, logger } from '../src/analyze';
import { ParametricClass } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();
logger.settings.minLevel = 0; // show all messages

project.createSourceFile("/parametrizableClass.ts",
`class ClassA<V> {}

class ClassB extends ClassA<string>{}

class ClassC<U> extends ClassA<U> {}


/// try to reproduce bug from jackson-js 

/**
 * Helper interface used to declare a List of ClassType recursively.
 */
export interface ClassList<T> extends Array<any> {
  [index: number]: T | ClassList<T>;
  0: T;
}

/**
 * Helper type that represents a general JavaScript type.
 */
export type ClassType<T> = (new () => T) | (new (...args: any[]) => T) |
((...args: any[]) => T) | ((...args: any[]) => ((cls: any) => T)) | { name: string; prototype: T };

interface JsonDecoratorOptions {
  enabled?: boolean;
  contextGroups?: string[];
  _descriptor?: TypedPropertyDescriptor<any>;
  _propertyKey?: string;
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for concrete and generic parameter', () => {
    
    it("should contain a concrete and generic parameter ''", () => {
        const classA = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>).find(v => v.name === "ClassA");
        expect(classA).toBeTruthy();
        const param = classA?.genericParameters;
        const firstParameter = param?.values().next().value as ParametricClass;
        expect(firstParameter?.name).toBe('V');
    });

    it("should contain a generic parameter 'U'", () => {
        const classC = Array.from(fmxRep._getAllEntitiesWithType("ParametricClass") as Set<ParametricClass>).find(v => v.name === "ClassC");
        expect(classC).toBeTruthy();
        const param = classC?.genericParameters;
        const firstParameter = param?.values().next().value as ParametricClass;
        expect(firstParameter?.name).toBe('U');
    });

});
