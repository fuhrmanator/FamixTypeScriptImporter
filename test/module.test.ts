import { Importer } from '../src/analyze';
import { ImportClause } from '../src/lib/famix/src/model/famix/import_clause';
import { Module } from '../src/lib/famix/src/model/famix/module';

const importer = new Importer();

const filePaths = new Array<string>();
filePaths.push("test_src/sampleForModule.ts");
filePaths.push("test_src/sampleForModule2.ts");
filePaths.push("test_src/sampleForModule3.ts");

const fmxRep = importer.famixRepFromPaths(filePaths);

describe('Tests for module', () => {
    
    const moduleList = Array.from(fmxRep._getAllEntitiesWithType('Module')) as Array<Module>;
    const theFile = moduleList.find(e => e.getName() === 'sampleForModule.ts');
    const theFile2 = moduleList.find(e => e.getName() === 'sampleForModule2.ts');
    const theFile3 = moduleList.find(e => e.getName() === 'sampleForModule3.ts');
    it("should have three modules", () => {
        expect(moduleList?.length).toBe(3);
        expect(theFile).toBeTruthy();
        expect(theFile2).toBeTruthy();
        expect(theFile3).toBeTruthy();
    });

    const theClass = fmxRep._getFamixClass('{sampleForModule.ts}.ClassZ');
    const importClauseList = Array.from(fmxRep._getAllEntitiesWithType('ImportClause')) as Array<ImportClause>;

    it("should have ten import clauses", () => {
        expect(importClauseList?.length).toBe(10);
        expect(theFile2?.getOutgoingImports().size).toBe(8);
        expect(theFile3?.getOutgoingImports().size).toBe(2);

        const theImportClause = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule2.ts' && e.getImportedEntity().getName() === 'ClassDeclaration' && e.getModuleSpecifier() === 'ts-morph');
        expect(theImportClause).toBeTruthy();
        const entity = theImportClause?.getImportedEntity();
        expect(entity?.getName()).toBe('ClassDeclaration');
        expect(entity?.getIsStub()).toBe(true);

        const theImportClause2 = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule2.ts' && e.getImportedEntity().getName() === 'ConstructorDeclaration' && e.getModuleSpecifier() === 'ts-morph');
        expect(theImportClause2).toBeTruthy();
        const entity2 = theImportClause2?.getImportedEntity();
        expect(entity2?.getName()).toBe('ConstructorDeclaration');
        expect(entity2?.getIsStub()).toBe(true);

        const theImportClause3 = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule2.ts' && e.getImportedEntity().getName() === 'Importer' && e.getModuleSpecifier() === '../test_src/sampleForModule');
        expect(theImportClause3).toBeTruthy();

        const theImportClause4 = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule2.ts' && e.getImportedEntity().getFullyQualifiedName() === '{sampleForModule.ts}.ClassZ' && e.getModuleSpecifier() === '../test_src/sampleForModule');
        
        expect(theImportClause4).toBeTruthy();

        expect(theImportClause4?.getImportedEntity()).toBe(theClass);

        const theImportClause5 = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule2.ts' && e.getImportedEntity().getName() === 'Cls' && e.getModuleSpecifier() === '../test_src/sampleForModule');
        expect(theImportClause5).toBeTruthy();

        const theImportClause6 = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule2.ts' && e.getImportedEntity().getName() === 'Nsp' && e.getModuleSpecifier() === '../test_src/sampleForModule');
        expect(theImportClause6).toBeTruthy();

        const theImportClause7 = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule2.ts' && e.getImportedEntity().getName() === 'Famix' && e.getModuleSpecifier() === '../src/lib/famix/src/model/famix');
        expect(theImportClause7).toBeTruthy();

        const theImportClause8 = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule2.ts' && e.getImportedEntity().getName() === 'express' && e.getModuleSpecifier() === 'express');
        expect(theImportClause8).toBeTruthy();

        const theImportClause9 = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule3.ts' && e.getImportedEntity().getName() === 'ClassX' && e.getModuleSpecifier() === 'express.ts');
        expect(theImportClause9).toBeTruthy();

        const theImportClause10 = importClauseList.find(e => e.getImportingEntity().getName() === 'sampleForModule3.ts' && e.getImportedEntity().getName() === 'test' && e.getModuleSpecifier() === './sampleForModule.ts');
        expect(theImportClause10).toBeTruthy();
    });
});
