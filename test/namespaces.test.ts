import { Importer } from '../src/analyze';
import { project } from './testUtils';

const importer = new Importer();

project.createSourceFile("/namespaces.ts", 
`namespace MyNamespace {}

module MyModule {}

declare module aModule {}

declare module "someModule" {}

declare module "otherModule";

declare namespace MyNamespace2 {}

import { Action } from 'myLib';

export namespace ToolbarConstants {
  export namespace Actions {
        export const CREATE_ACTION: Action = {
            label: 'aLabel',
        };
  }
}`);

const fmxRep = importer.famixRepFromProject(project);

describe('Tests for namespaces', () => {
    
    it("should contain the exact number of namespaces", () => {
        expect(fmxRep._getFamixModules().size).toBe(9);
    });

    const theNamespace1 = fmxRep._getFamixModule("{namespaces.ts}.MyNamespace[ModuleDeclaration]");
    it("should contain a namespace MyNamespace", () => {
        expect(theNamespace1).toBeTruthy();
    });

    const theNamespace2 = fmxRep._getFamixModule("{namespaces.ts}.MyModule[ModuleDeclaration]");
    it("should contain a namespace MyModule", () => {
        expect(theNamespace2).toBeTruthy();
    });

    const theNamespace3 = fmxRep._getFamixModule("{namespaces.ts}.aModule[ModuleDeclaration]");
    it("should contain a namespace aModule", () => {
        expect(theNamespace3).toBeTruthy();
    });

    const theNamespace4 = fmxRep._getFamixModule("{namespaces.ts}.\"someModule\"[ModuleDeclaration]");
    it("should contain a namespace \"someModule\"", () => {
        expect(theNamespace4).toBeTruthy();
    });

    const theNamespace5 = fmxRep._getFamixModule("{namespaces.ts}.\"otherModule\"[ModuleDeclaration]");
    it("should contain a namespace \"otherModule\"", () => {
        expect(theNamespace5).toBeTruthy();
    });

    const theNamespace6 = fmxRep._getFamixModule("{namespaces.ts}.MyNamespace2[ModuleDeclaration]");
    it("should contain a namespace MyNamespace2", () => {
        expect(theNamespace6).toBeTruthy();
    });

    const theNamespace7 = fmxRep._getFamixModule("{namespaces.ts}.ToolbarConstants[ModuleDeclaration]");
    it("should contain a namespace ToolbarConstants", () => {
        expect(theNamespace7).toBeTruthy();
    });

    const theNamespace8 = fmxRep._getFamixModule("{namespaces.ts}.ToolbarConstants.Actions[ModuleDeclaration]");
    it("should contain a namespace ToolbarConstants", () => {
        expect(theNamespace8).toBeTruthy();
    });
    // test to see if Actions is nested in ToolbarConstants
    it("should have Actions nested in ToolbarConstants", () => {
        expect(theNamespace8?.getParentScope()).toBe(theNamespace7);
    });
    // see if CREATE_ACTION is nested in Actions
    const theVariable = fmxRep._getFamixVariable("{namespaces.ts}.ToolbarConstants.Actions.CREATE_ACTION[VariableDeclaration]");
    it("should have CREATE_ACTION nested in Actions", () => {
        expect(theVariable?.getParentContainerEntity()).toBe(theNamespace8);
    });

    // fmxRep._getFamixModules().forEach(m => { console.log(m.getFullyQualifiedName()) });

    // the main file is a module because it exports/imports
    const theNamespace9 = fmxRep._getFamixModule("{namespaces.ts}[SourceFile]");
    it("should contain a module for the main file", () => {
        expect(theNamespace9).toBeTruthy();
    });

});
