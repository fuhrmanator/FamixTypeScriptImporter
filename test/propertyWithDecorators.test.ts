import { Importer } from '../src/analyze';
import { Decorator } from '../src/lib/famix/src/model/famix/decorator';
import { Property } from '../src/lib/famix/src/model/famix/property';
import { project } from './testUtils';

const importer = new Importer();
project.createSourceFile("/propertyWithDecorators.ts",
`import "reflect-metadata";

const formatMetadataKey = Symbol("format");

function format(formatString: string) {
    return Reflect.metadata(formatMetadataKey, formatString);
}

function getFormat(target: any, propertyKey: string) {
    return Reflect.getMetadata(formatMetadataKey, target, propertyKey);
}

function deco(bo: boolean) {
    return function(target: any, propertyKey: string) { // no property descriptor in the signature of the property decorator
        console.log(bo);
    };
}

var h = format("Hello, %s");
var o = deco(true);
var t = deco;

class Greeter {
    @deco(true)
    @h
    @o
    @t(false)
    @format("Hello, %s")
    greeting: string;
    
    constructor(message: string) {
        this.greeting = message;
    }
    
    greet() {
        let formatString = getFormat(this, "greeting");
        return formatString.replace("%s", this.greeting);
    }
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for property with decorators', () => {
    
    it("should contain one class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(1);
    });

    it("should contain a property 'greeting'", () => {
        expect(fmxRep._getAllEntitiesWithType("Property").size).toBe(1);
        const theProperty = (Array.from(fmxRep._getFamixClass("{propertyWithDecorators.ts}.Greeter[ClassDeclaration]")?.properties as Set<Property>) as Array<Property>).find((f) => f.getName() === "greeting");
        expect(theProperty).toBeTruthy();
    });

    it("should contain five decorators", () => {
        expect(fmxRep._getAllEntitiesWithType("Decorator").size).toBe(5);
    });

    const theProperty = (Array.from(fmxRep._getFamixClass("{propertyWithDecorators.ts}.Greeter[ClassDeclaration]")?.properties as Set<Property>) as Array<Property>).find((f) => f.getName() === "greeting");
    const d1 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.getName() === "@deco");
    const d2 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.getName() === "@h");
    const d3 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.getName() === "@o");
    const d4 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.getName() === "@t");
    const d5 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.getName() === "@format");

    it("should contain a property with five decorators", () => {
        expect(theProperty?.getDecorators().size).toBe(5);
        expect(d1?.getDecoratedEntity()).toBe(theProperty);
        expect(d2?.getDecoratedEntity()).toBe(theProperty);
        expect(d3?.getDecoratedEntity()).toBe(theProperty);
        expect(d4?.getDecoratedEntity()).toBe(theProperty);
        expect(d5?.getDecoratedEntity()).toBe(theProperty);
    });
});
