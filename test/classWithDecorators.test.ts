import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import { Decorator } from '../src/lib/famix/src/model/famix/decorator';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./src"
        }
    }
);

project.createSourceFile("./src/classWithDecorators.ts",
`function sealed(constructor: Function) { // function can't take other parameters with constructor
    Object.seal(constructor);
    Object.seal(constructor.prototype);
}

function reportableClassDecorator<T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
        reportingURL = "http://www...";
    };
}

// the signature is different from the one of the other decorators
var d = function decoratorWithParameter(parameter: string) {
    return function (target: Function) {
        // use parameter in decorator behavior
        console.log("Decorator parameter :", parameter);
    };
};

var c = d("param2");

@c
@d("param")
@sealed
@reportableClassDecorator
class BugReport {
    type = "report";
    title: string;
    
    constructor(t: string) {
        this.title = t;
    }
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for class with decorators', () => {
    
    it("should contain one class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(1);
    });

    it("should contain four decorators", () => {
        expect(fmxRep._getAllEntitiesWithType("Decorator").size).toBe(4);
    });

    const theClass = fmxRep._getFamixClass("{classWithDecorators.ts}.BugReport");
    const d1 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.getName() === "@c");
    const d2 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.getName() === "@d");
    const d3 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.getName() === "@sealed");
    const d4 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.getName() === "@reportableClassDecorator");

    it("should contain a class with four decorators", () => {
        expect(theClass?.getDecorators().size).toBe(4);
        expect(d1?.getDecoratedEntity()).toBe(theClass);
        expect(d2?.getDecoratedEntity()).toBe(theClass);
        expect(d3?.getDecoratedEntity()).toBe(theClass);
        expect(d4?.getDecoratedEntity()).toBe(theClass);
    });
});
