import { Importer } from '../src/analyze';
import { Interface } from '../src/lib/famix/model/famix';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/interfaceInheritsUndefinedInterface.ts",
`import {FileSystemHost} from "ts-morph";

interface MyInterface extends FileSystemHost {}
`);

const fmxRep = importer.famixRepFromProject(project);

let baseInterface: Interface | undefined;
const baseInterfaceName = "FileSystemHost";
const baseInterfacePath = "{module:ts-morph}";
const baseInterfaceFQN = `${baseInterfacePath}.${baseInterfaceName}[InterfaceDeclaration]`;

let extendingInterface: Interface | undefined;
const extendingInterfaceName = "MyInterface";

describe('Tests for interface inherits undefined (stub) interface', () => {

    it("should contain an imported interface FileSystemHost", () => {
        baseInterface = fmxRep._getFamixInterface(baseInterfaceFQN);
        expect(baseInterface).toBeTruthy();
    });

    it("should contain an interface MyInterface that extends an interface FileSystemHost", () => {
        extendingInterface = fmxRep._getFamixInterface(`{interfaceInheritsUndefinedInterface.ts}.${extendingInterfaceName}[InterfaceDeclaration]`);
        expect(extendingInterface).toBeTruthy();

        expect(extendingInterface?.name).toBe(extendingInterfaceName);

        // Check that the interface extends the base interface
        const superInheritances = extendingInterface?.superInheritances;
        expect(superInheritances).toBeTruthy();
        expect(superInheritances?.size).toBe(1);
        const superInheritance = superInheritances ? Array.from(superInheritances)[0] : undefined;
        expect(superInheritance?.superclass).toBe(baseInterface);
        expect(superInheritance?.subclass).toBe(extendingInterface);
        expect(superInheritance?.superclass?.name).toBe(baseInterfaceName);
    });

    it("should contain two interfaces", () => {
        expect(fmxRep._getAllEntitiesWithType("Interface").size).toBe(2);
    });

});
