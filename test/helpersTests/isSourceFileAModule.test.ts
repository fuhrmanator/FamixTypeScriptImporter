import { Project } from 'ts-morph';
import { isSourceFileAModule } from '../../src/famix_functions/helpersTsMorphElementsProcessing';

describe('isSourceFileAModule', () => {
    let project: Project;

    beforeEach(() => {
        project = new Project({
            useInMemoryFileSystem: true,
        });
    });

    afterEach(() => {
        project.getSourceFiles().forEach(sourceFile => sourceFile.delete());
    });

    it('should return true for file with import declarations', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            import { Component } from 'react';
            
            class MyClass {
                // some code
            }
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return true for file with import equals declaration', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            import fs = require('fs');
            
            class MyClass {
                // some code
            }
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return true for file with namespace import', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            import * as React from 'react';
            
            class MyComponent {
                // some code
            }
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return true for file with export declarations', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            class MyClass {
                // some code
            }
            
            export { MyClass };
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return true for file with default export', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            class MyClass {
                // some code
            }
            
            export default MyClass;
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return true for file with multiple module indicators', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            import { Component } from 'react';
            import fs = require('fs');
            
            class MyClass {
                // some code
            }
            
            export { MyClass };
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return false for file without any module indicators', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            class MyClass {
                // some code
            }
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(false);
    });

    it('should return true for file with re-export', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            export { MyClass } from './otherModule';
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return true for file with re-export default', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            export { default as MyClass } from './otherModule';
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return true for file with export all', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            export * from './otherModule';
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return true for file with type-only imports', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            import type { MyType } from './types';
            
            class MyClass implements MyType {
                // some code
            }
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });

    it('should return true for file with type-only exports', () => {
        const sourceFile = project.createSourceFile('test.ts', `
            type MyType = {
                name: string;
            };
            
            export type { MyType };
        `);

        expect(isSourceFileAModule(sourceFile)).toBe(true);
    });
});
