// TODO add fully qualified name tests

/**
 * TODO e.g.
        let fqn = importClause?.getImportingEntity()?.getFullyQualifiedName();
        expect(fqn).toBeTruthy();
        fqn = fqn?.replace(/"/g, ""); // remove wrapping quotes
        expect(fqn?.split("/").pop()).toBe('defaultImporterModule.ts');
        // expect the the fully qualified name of the imported entity (without quotes) to be test
        const importedEntity = importClause?.getImportedEntity();
        expect(importedEntity).toBeTruthy();
        let importedFqn = importedEntity?.getFullyQualifiedName();
        expect(importedFqn).toBeTruthy();
        importedFqn = importedFqn?.replace(/"/g, ""); // remove wrapping quotes
        expect(importedFqn?.split("/").pop()).toBe('test');

 */