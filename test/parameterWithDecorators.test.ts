import { Importer } from '../src/analyze';
import { Decorator } from '../src/lib/famix/src/model/famix/decorator';
import { Parameter } from '../src/lib/famix/src/model/famix/parameter';
import { project } from './testUtils';

const path = require('path');
const importer = new Importer();

project.createSourceFile("/parameterWithDecorators.ts",
`function deco2(bo: boolean) {
    return function(target: Object, propertyKey: string, parameterIndex: number) {
        console.log(bo);
    };
}

var tes = deco2(false);

class BugReport2 {
    type = "report";
    title: string;
    
    constructor(t: string) {
        this.title = t;
    }
    
    print(@tes @deco2(true) verbose: boolean) {
        if (verbose) {
            return \`type: \${this.type}, title: \${this.title}\`;
        }
        else {
            return this.title;
        }
    }
}
`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for parameter with decorators', () => {
    
    it("should contain one class", () => {
        expect(fmxRep._getAllEntitiesWithType("Class").size).toBe(1);
    });

    it("should contain two decorators", () => {
        expect(fmxRep._getAllEntitiesWithType("Decorator").size).toBe(2);
    });

    const theParam = (Array.from(fmxRep._getFamixMethod("{parameterWithDecorators.ts}.BugReport2.print[MethodDeclaration]")?.parameters as Set<Parameter>) as Array<Parameter>).find((f) => f.name === "verbose");
    const d1 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.name === "@tes");
    const d2 = (Array.from(fmxRep._getAllEntitiesWithType("Decorator")) as Array<Decorator>).find((d) => d.name === "@deco2");

    it("should contain a parameter with two decorators", () => {
        expect(theParam?.decorators.size).toBe(2);
        expect(d1?.decoratedEntity).toBe(theParam);
        expect(d2?.decoratedEntity).toBe(theParam);
    });
});
