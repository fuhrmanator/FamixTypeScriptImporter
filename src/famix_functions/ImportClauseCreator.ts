import { FamixRepository } from "../lib/famix/famix_repository";
import { EntityDictionary, TSMorphObjectType } from "./EntityDictionary";
import { ExportDeclaration, ExportSpecifier, ImportDeclaration, ImportSpecifier, SourceFile, Node, ts, Identifier, Symbol, ImportEqualsDeclaration } from "ts-morph";
import { getDeclarationFromImportOrExport, getDeclarationFromSymbol } from "./helpersTsMorphElementsProcessing";
import { getFamixIndexFileAnchorFileName } from "../helpers";
import * as Famix from "../lib/famix/model/famix";
import * as FQNFunctions from "../fqn";

export class ImportClauseCreator {
    private entityDictionary: EntityDictionary;
    private famixRep: FamixRepository;

    constructor(entityDictionary: EntityDictionary) {
        this.entityDictionary = entityDictionary;
        this.famixRep = entityDictionary.famixRep;
    }

    public ensureFamixImportClauseForNamedImport(
        importDeclaration: ImportDeclaration | ExportDeclaration, 
        namedImport: ImportSpecifier | ExportSpecifier | Identifier, 
        importingSourceFile: SourceFile
    ) {
        const namedEntityDeclaration = getDeclarationFromImportOrExport(namedImport);

        const importedEntity = this.ensureImportedEntity(namedEntityDeclaration, namedImport);
        const importingEntity = this.assertImportingEntity(importingSourceFile);
        const moduleSpecifier = this.getModuleSpecifierFromDeclaration(importDeclaration);
        this.ensureFamixImportClause(importedEntity, importingEntity, moduleSpecifier, importDeclaration);
    }

    /**
     * Currently we create one import clause per every export in the file that is imported with namespace import.
     * Ex.: import * as ns from "module";
     * if exporting file contains namespace reexport - we will create a separate import clause between importing file
     * and every reexport. 
     * 
     * The advantage of this approach - is that we can see every imported entity even if it is reexported multiple times.
     * 
     * The disadvantage - is that it may lead to a large number of import clauses. If this will cause a performance issue - 
     * we may try to create only one import clause for a namespace import. Then we can make the imported entity a stub.
     */
    public ensureFamixImportClauseForNamespaceImport(
        importDeclaration: ImportDeclaration, namespaceImport: Identifier, importingSourceFile: SourceFile
    ) {
        const moduleSpecifier = this.getModuleSpecifierFromDeclaration(importDeclaration);

        const localSymbol = namespaceImport.getSymbolOrThrow();
        const moduleSymbol = localSymbol.getAliasedSymbolOrThrow();
        const exportsOfModule = moduleSymbol.getExports();

        const importingEntity = this.assertImportingEntity(importingSourceFile);

        this.handleNamespaceImportOrExport(exportsOfModule, importingEntity, moduleSpecifier, namespaceImport);
    }

    public ensureFamixImportClauseForNamespaceExports(
        exportDeclaration: ExportDeclaration,
        exportingFile: SourceFile
    ) {
        const moduleSpecifierSourceFile = exportDeclaration.getModuleSpecifierSourceFile();
        const moduleSpecifierSymbol = moduleSpecifierSourceFile?.getSymbol();

        const moduleSpecifier = this.getModuleSpecifierFromDeclaration(exportDeclaration);

        const importingEntity = this.assertImportingEntity(exportingFile);

        if (moduleSpecifierSymbol) {
            const reexportedExports = moduleSpecifierSymbol.getExports();
            this.handleNamespaceImportOrExport(reexportedExports, importingEntity, moduleSpecifier, exportDeclaration);
        } else {
            // TODO: add a stub to the repo only when it is checked that the import clause does not exists yet
            // to avoid stub duplication
            const importedEntity = this.ensureImportedEntityStub(exportDeclaration);
            this.ensureFamixImportClause(importedEntity, importingEntity, moduleSpecifier, exportDeclaration);
        }
    }

    /**
     * Implement it similar to named import. If we export an expression assignment, ex.: export default 42 + 3; 
     * - than just create a stub. For the cases like next:
     * class A { }
     * class B { }
     * export default { A, B }
     * I would suggest to create a stub for the default import. But also it can be implemented in a way of
     * creating separate import clauses for A and B, but it may add unnecessary complexity.
     */
    public ensureFamixImportClauseForDefaultImport(
        importDeclaration: ImportDeclaration, defaultImport: Identifier, module: SourceFile
    ) {
        const namedEntityDeclaration = getDeclarationFromImportOrExport(defaultImport);
        const moduleSpecifier = this.getModuleSpecifierFromDeclaration(importDeclaration);

        // TODO: finish implementation
        throw new Error("Not implemented");
    }

    public ensureFamixImportClauseForImportEqualsDeclaration(importEqualsDeclaration: ImportEqualsDeclaration) {
        throw new Error("Not implemented");
    }

    private ensureImportedEntity = (namedEntityDeclaration: Node<ts.Node> | undefined, importedEntityDeclaration: Node<ts.Node>) => {
        let importedEntity: Famix.NamedEntity | undefined;
        
        if (namedEntityDeclaration) {
            const importedFullyQualifiedName = FQNFunctions.getFQN(namedEntityDeclaration, this.entityDictionary.getAbsolutePath());
            importedEntity = this.famixRep.getFamixEntityByFullyQualifiedName<Famix.NamedEntity>(importedFullyQualifiedName);
        }
        if (!importedEntity) {
            // TODO: check how do we create the FQN for the import specifier
            
            // TODO: add a stub to the repo only when it is checked that the import clause does not exists yet
            // to avoid stub duplication
            importedEntity = this.ensureImportedEntityStub(importedEntityDeclaration);
        }
        return importedEntity;
    };

    private assertImportingEntity = (importingSourceFile: SourceFile) => {
        const importingFullyQualifiedName = FQNFunctions.getFQN(importingSourceFile, this.entityDictionary.getAbsolutePath());
        const importingEntity = this.famixRep.getFamixEntityByFullyQualifiedName<Famix.Module>(importingFullyQualifiedName);
        if (!importingEntity) {
            throw new Error(`Famix importer with FQN ${importingFullyQualifiedName} not found.`);
        }
        return importingEntity;
    };

    private ensureFamixImportClause(
        importedEntity: Famix.NamedEntity, 
        importingEntity: Famix.Module,
        moduleSpecifier: string,
        importOrExportDeclaration: Node<ts.Node>
    ) {
        const fmxImportClause = new Famix.ImportClause();
        fmxImportClause.importedEntity = importedEntity;
        fmxImportClause.importingEntity = importingEntity;
        fmxImportClause.moduleSpecifier = moduleSpecifier;

        const existingFmxImportClause = this.famixRep.getFamixEntityByFullyQualifiedName<Famix.ImportClause>(fmxImportClause.fullyQualifiedName);
        if (!existingFmxImportClause) {
            this.entityDictionary.makeFamixIndexFileAnchor(importOrExportDeclaration as TSMorphObjectType, fmxImportClause);
            this.famixRep.addElement(fmxImportClause);
        }
    }    

    private getModuleSpecifierFromDeclaration(importOrExportDeclaration: ImportDeclaration | ExportDeclaration): string {
        let moduleSpecifierFileName = importOrExportDeclaration.getModuleSpecifierValue();
        // TODO: test this path finding with node modules, declaration files, etc.
        // It is important that this name can be used later for finding the file name which is used for the source anchor
        if (moduleSpecifierFileName && !moduleSpecifierFileName.endsWith('.ts')) {
            moduleSpecifierFileName = moduleSpecifierFileName + '.ts';
        }
        //-------------------------------

        return getFamixIndexFileAnchorFileName(
            moduleSpecifierFileName ?? '',
            this.entityDictionary.getAbsolutePath()
        );
    }

    private ensureImportedEntityStub(importOrExportDeclaration: Node<ts.Node>) {
        return this.entityDictionary.ensureFamixElement<Node<ts.Node>, Famix.NamedEntity>(importOrExportDeclaration, () => {
            const stub = new Famix.NamedEntity();
            stub.isStub = true;
            // TODO: add other properties
            return stub;
        });
    };

    /**
     * Ensures namespace import or export.
     * @param exports All the exports of the exporting file.
     * @param importingEntity The entity for the importing module.
     * @param moduleSpecifier The name of the exporting file (if re-exports - the name of the first exporting file in the chain).
     * @param importOrExportDeclaration The declaration for the import/export. Ex.: "import * as ns from 'module';"
     */
    private handleNamespaceImportOrExport(
        exports: Symbol[],
        importingEntity: Famix.Module,
        moduleSpecifier: string,
        importOrExportDeclaration: Node<ts.Node>
    ) {
        const exportsOfModuleSet = new Set(exports);
        let importedEntity: Famix.NamedEntity;

        // It no exports found - create a stub
        if (exportsOfModuleSet.size === 0) {
            // TODO: add a stub to the repo only when it is checked that the import clause does not exists yet
            // to avoid stub duplication
            importedEntity = this.ensureImportedEntityStub(importOrExportDeclaration);
            this.ensureFamixImportClause(importedEntity, importingEntity, moduleSpecifier, importOrExportDeclaration);
            return;
        }

        const handleExportSpecifier = (exportedDeclaration: ExportSpecifier) => {
            const smb = exportedDeclaration.getSymbol();
            const aliasedSmb = smb?.getAliasedSymbol();
            if (aliasedSmb) {
                if (!processedExportsOfModuleSet.has(aliasedSmb)) {
                    exportsOfModuleSet.add(aliasedSmb);
                }
            } else { // else - it means the re-export chain is broken
                // TODO: add a stub to the repo only when it is checked that the import clause does not exists yet
                // to avoid stub duplication
                importedEntity = this.ensureImportedEntityStub(importOrExportDeclaration);
                this.ensureFamixImportClause(importedEntity, importingEntity, moduleSpecifier, importOrExportDeclaration); 
            }
        };

        const handleNamespaceExport = (exportedDeclaration: ExportDeclaration) => {
            const exportDeclarationModule = exportedDeclaration.getModuleSpecifierSourceFile()?.getSymbol();
            if (exportDeclarationModule) {
                const reexportedExports = exportDeclarationModule.getExports();
                reexportedExports.forEach(exp => {
                    if (!processedExportsOfModuleSet.has(exp)) {
                        exportsOfModuleSet.add(exp);
                    }
                });
            } else { // else - it means the re-export chain is broken
                // TODO: add a stub to the repo only when it is checked that the import clause does not exists yet
                // to avoid stub duplication
                importedEntity = this.ensureImportedEntityStub(importOrExportDeclaration);
                this.ensureFamixImportClause(importedEntity, importingEntity, moduleSpecifier, importOrExportDeclaration);
            }
        };

        const processedExportsOfModuleSet = new Set<Symbol>();
        while (exportsOfModuleSet.size > 0) {
            const exportedSymbol = exportsOfModuleSet.values().next().value!;
            exportsOfModuleSet.delete(exportedSymbol);
            processedExportsOfModuleSet.add(exportedSymbol);

            const exportedDeclaration = getDeclarationFromSymbol(exportedSymbol);
            if (Node.isExportSpecifier(exportedDeclaration)) {
                handleExportSpecifier(exportedDeclaration);
            } else if (Node.isExportDeclaration(exportedDeclaration) && exportedDeclaration.isNamespaceExport()) {
                handleNamespaceExport(exportedDeclaration);
            } else {
                const importedEntity = this.ensureImportedEntity(exportedDeclaration, importOrExportDeclaration);
                this.ensureFamixImportClause(importedEntity, importingEntity, moduleSpecifier, importOrExportDeclaration);
            }
        }
    }
}