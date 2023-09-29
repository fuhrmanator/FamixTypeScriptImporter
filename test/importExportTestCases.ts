import { Project, SourceFile } from "ts-morph";

export function createSourceFileMap(project: Project) {
  const sourceFileMap = new Map<string, SourceFile>();
  for (const testCase of importCases.concat(exportCases)) {
    const sourceFile = project.createSourceFile(`test_src/${testCase.name}.ts`, testCase.content, {
      overwrite: true,
    });
    sourceFile.saveSync();
    sourceFileMap.set(testCase.name, sourceFile);
  }
  return sourceFileMap;
}

// Define a set of exports
const exportCases = [
    {
      name: "basicExport",
      content: `
        export const variable1 = "Hello, World!";
      `,
    },
    {
      name: "defaultExport",
      content: `
        export default function greet() {
          return "Hello, Default!";
        }
      `,
    },
    {
      name: "namedExports",
      content: `
        export const namedExport1 = 42;
        export const namedExport2 = true;
      `,
    },
    {
      name: "reexportNamedExport",
      // Re-export a named export from another module
      content: `
        export { namedExport1 as renamedExport } from './namedExports';
      `,
    },
    {
      name: "exportWithinNamespace",
      // Export a something defined inside a namespace
      content: `
        export namespace myModule {
          export function greet(name: string): string {
            return "Hello, "+ name + "!";
          }
        
          export const version: string = "1.0.0";
        }
      `,
    },
    {
      name: "reexportDefaultExport",
      // Re-export a default export from another module
      content: `
        export { default as greetFunction } from './defaultExport';
      `,
    },
  ];
  
  // Define a set of imports
  const importCases = [
    {
      name: "importBasicExport",
      content: `
        import { variable1 } from './basicExport';
      `,
    },
    {
      name: "importDefaultExport",
      content: `
        import greetFunction from './defaultExport';
      `,
    },
    {
      name: "importNamedExports",
      content: `
        import { namedExport1, namedExport2 } from './namedExports';
      `,
    },
    {
      name: "importRenamedNamedExport",
      content: `
        import { renamedExport } from './reexportNamedExport';
      `,
    },
    {
      name: "importReexportDefaultExport",
      content: `
        import greetFunction from './reexportDefaultExport';
      `,
    },
    {
      name: "importWithinNamespace",
      content: `
        import { greet } from './exportWithinNamespace';
      `,
    },
    // module that imports from a third-party library, e.g. lodash
    {
      name: "importThirdParty",
      content: `
        import { isString } from 'lodash';
      `,
    }
  ];
  