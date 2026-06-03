import { Importer, SourceFileChangeType } from '../src/analyze';
import { createProject } from './testUtils';

describe('Incremental update', () => {

    it('should produce the same model as a full rebuild after adding a method', () => {
        const projectFull = createProject();
        projectFull.createSourceFile('/Animal.ts', `export class Animal { name: string; }`);
        projectFull.createSourceFile('/Cat.ts', `
            import { Animal } from './Animal';
            export class Cat extends Animal {
                speak(): string { return 'meow'; }
                sleep(): string { return 'zzz'; }
            }
        `);
        const fullRep = new Importer().famixRepFromProject(projectFull);
        const fullMethods = fullRep._getAllEntitiesWithType('FamixTypeScript.Method').size;

        const projectInc = createProject();
        projectInc.createSourceFile('/Animal.ts', `export class Animal { name: string; }`);
        const catFile = projectInc.createSourceFile('/Cat.ts', `
            import { Animal } from './Animal';
            export class Cat extends Animal {
                speak(): string { return 'meow'; }
            }
        `);
        const importerInc = new Importer();
        importerInc.famixRepFromProject(projectInc);

        catFile.replaceWithText(`
            import { Animal } from './Animal';
            export class Cat extends Animal {
                speak(): string { return 'meow'; }
                sleep(): string { return 'zzz'; }
            }
        `);
        importerInc.updateFamixModelIncrementally(new Map([[SourceFileChangeType.Update, [catFile]]]));
        const incMethods = importerInc['entityDictionary'].famixRep._getAllEntitiesWithType('FamixTypeScript.Method').size;

        expect(incMethods).toBe(fullMethods);
    });

    it('should produce the same model as a full rebuild after removing a method', () => {
        const projectFull = createProject();
        projectFull.createSourceFile('/Animal.ts', `export class Animal { name: string; }`);
        projectFull.createSourceFile('/Cat.ts', `
            import { Animal } from './Animal';
            export class Cat extends Animal {
                speak(): string { return 'meow'; }
            }
        `);
        const fullRep = new Importer().famixRepFromProject(projectFull);
        const fullMethods = fullRep._getAllEntitiesWithType('FamixTypeScript.Method').size;

        const projectInc = createProject();
        projectInc.createSourceFile('/Animal.ts', `export class Animal { name: string; }`);
        const catFile = projectInc.createSourceFile('/Cat.ts', `
            import { Animal } from './Animal';
            export class Cat extends Animal {
                speak(): string { return 'meow'; }
                sleep(): string { return 'zzz'; }
            }
        `);
        const importerInc = new Importer();
        importerInc.famixRepFromProject(projectInc);

        catFile.replaceWithText(`
            import { Animal } from './Animal';
            export class Cat extends Animal {
                speak(): string { return 'meow'; }
            }
        `);
        importerInc.updateFamixModelIncrementally(new Map([[SourceFileChangeType.Update, [catFile]]]));
        const incMethods = importerInc['entityDictionary'].famixRep._getAllEntitiesWithType('FamixTypeScript.Method').size;

        expect(incMethods).toBe(fullMethods);
    });
});
