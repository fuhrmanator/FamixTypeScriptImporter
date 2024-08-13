import { Importer } from '../src/analyze';
import { Access } from '../src/lib/famix/src/model/famix/access';
import { Decorator } from '../src/lib/famix/src/model/famix/decorator';
import { Property } from '../src/lib/famix/src/model/famix/property';
import { Accessor } from '../src/lib/famix/src/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile('/accessorsWithDecorators.ts',
`function configurable(value: boolean) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = value;
    };
}

var b = function() {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {};
};

var x = b();

class Point {
    private _x: number;
    private _y: number;
    
    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }
    
    @x
    @b()
    @configurable(false)
    get x() {
        return this._x;
    }
    
    @x
    @b()
    @configurable(false)
    set y(y: number) {
        this._y = y;
    }
}
`);

const fmxRep = importer.famixRepFromProject(project);
    
describe('Tests for accessors with decorators', () => {
    
    it("should contain one class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(1);
    });

    it("should contain six decorators", () => {
        expect(fmxRep._getAllEntitiesWithType("Decorator").size).toBe(6);
    });

    const accessors = fmxRep._getAllEntitiesWithType("Accessor") as Set<Accessor>;
    const theMethod1 = Array.from(accessors).find((a) => a.name === "x");
    const theMethod2 = Array.from(accessors).find((a) => a.name === "y");

    it("should contain two accessors", () => {
        expect(accessors.size).toBe(2);
        expect(theMethod1).toBeTruthy();
        expect(theMethod2).toBeTruthy();
    });

    const d1 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).filter((d) => d.name === "@x");
    const d2 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).filter((d) => d.name === "@b");
    const d3 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).filter((d) => d.name === "@configurable");

    it("should contain two accessors with three decorators for each one", () => {
        expect(fmxRep._getAllEntitiesWithType("Accessor").size).toBe(2);
        expect(fmxRep._getAllEntitiesWithType("Decorator").size).toBe(6);

        expect(theMethod1?.decorators.size).toBe(3);
        expect(d1[0]?.decoratedEntity).toBe(theMethod1);
        expect(d2[0]?.decoratedEntity).toBe(theMethod1);
        expect(d3[0]?.decoratedEntity).toBe(theMethod1);

        expect(theMethod2?.decorators.size).toBe(3);
        expect(d1[1]?.decoratedEntity).toBe(theMethod2);
        expect(d2[1]?.decoratedEntity).toBe(theMethod2);
        expect(d3[1]?.decoratedEntity).toBe(theMethod2);
    });

    it("should contain two accesses to '_x'", () => {
        const theProperty = Array.from(fmxRep._getAllEntitiesWithType("Property") as Set<Property>).find(v => v.name === "_x");
        const theMethod1 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.constructor[Constructor]");
        expect(theMethod1?.kind).toBe("constructor");
        const theMethod2 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.x[GetAccessor]");
        expect(theMethod2?.kind).toBe("getter");
        const theAccess1 = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.variable === theProperty && a.accessor === theMethod1);
        const theAccess2 = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.variable === theProperty && a.accessor === theMethod2);
        expect(theAccess1).toBeTruthy();
        expect(theAccess2).toBeTruthy();
    });

    it("should contain two accesses to '_y'", () => {
        const theProperty = Array.from(fmxRep._getAllEntitiesWithType("Property") as Set<Property>).find(v => v.name === "_y");
        const theMethod1 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.constructor[Constructor]");
        const theMethod2 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.y[SetAccessor]");
        expect(theMethod2?.kind).toBe("setter");
        const theAccess1 = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.variable === theProperty && a.accessor === theMethod1);
        const theAccess2 = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.variable === theProperty && a.accessor === theMethod2);
        expect(theAccess1).toBeTruthy();
        expect(theAccess2).toBeTruthy();
    });
});
