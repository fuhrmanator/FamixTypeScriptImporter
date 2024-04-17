import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Access } from '../src/lib/famix/src/model/famix/access';
import { Decorator } from '../src/lib/famix/src/model/famix/decorator';
import { Property } from '../src/lib/famix/src/model/famix/property';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);
project.createSourceFile('./src/accessorsWithDecorators.ts',
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

    const theMethod1 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.x");
    const theMethod2 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.y");
    const d1 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).filter((d) => d.getName() === "@x");
    const d2 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).filter((d) => d.getName() === "@b");
    const d3 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).filter((d) => d.getName() === "@configurable");

    it("should contain two accessors with three decorators for each one", () => {
        expect(fmxRep._getAllEntitiesWithType("Accessor").size).toBe(2);
        expect(fmxRep._getAllEntitiesWithType("Decorator").size).toBe(6);

        expect(theMethod1?.getDecorators().size).toBe(3);
        expect(d1[0]?.getDecoratedEntity()).toBe(theMethod1);
        expect(d2[0]?.getDecoratedEntity()).toBe(theMethod1);
        expect(d3[0]?.getDecoratedEntity()).toBe(theMethod1);

        expect(theMethod2?.getDecorators().size).toBe(3);
        expect(d1[1]?.getDecoratedEntity()).toBe(theMethod2);
        expect(d2[1]?.getDecoratedEntity()).toBe(theMethod2);
        expect(d3[1]?.getDecoratedEntity()).toBe(theMethod2);
    });

    it("should contain two accesses to '_x'", () => {
        const theProperty = Array.from(fmxRep._getAllEntitiesWithType("Property") as Set<Property>).find(v => v.getName() === "_x");
        const theMethod1 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.constructor");
        const theMethod2 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.x");
        expect(theMethod2?.getKind()).toBe("getter");
        const theAccess1 = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.getVariable() === theProperty && a.getAccessor() === theMethod1);
        const theAccess2 = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.getVariable() === theProperty && a.getAccessor() === theMethod2);
        expect(theAccess1).toBeTruthy();
        expect(theAccess2).toBeTruthy();
    });

    it("should contain two accesses to '_y'", () => {
        const theProperty = Array.from(fmxRep._getAllEntitiesWithType("Property") as Set<Property>).find(v => v.getName() === "_y");
        const theMethod1 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.constructor");
        const theMethod2 = fmxRep._getFamixMethod("{accessorsWithDecorators.ts}.Point.y");
        expect(theMethod2?.getKind()).toBe("setter");
        const theAccess1 = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.getVariable() === theProperty && a.getAccessor() === theMethod1);
        const theAccess2 = Array.from(fmxRep._getAllEntitiesWithType("Access") as Set<Access>).find(a => a.getVariable() === theProperty && a.getAccessor() === theMethod2);
        expect(theAccess1).toBeTruthy();
        expect(theAccess2).toBeTruthy();
    });
});
