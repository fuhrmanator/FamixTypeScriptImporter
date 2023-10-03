import { EnumDeclaration, FunctionDeclaration, Project, SourceFile, VariableStatement, ts } from 'ts-morph';

export class ExportedElement {
    name: string;
    sourceFile: SourceFile;
    type: 'variable' | 'function' | 'enum';
    aliases: NameAlias[];
}

export class NameAlias {
    alias: string;
    sourceFile: SourceFile;
    renamedOn: 'import' | 'export';
}

export function doIt(project: Project): ExportedElement[] {

    const exportedElements: ExportedElement[] = [];

    // find the list of exported variables
    const exportedVariables = project.getSourceFiles().map(sourceFile => {
        const variableStatements = sourceFile.getVariableStatements();
        return variableStatements.filter(statement => statement.hasExportKeyword());
    }).flat();

    // output the exported variables
    exportedVariables.forEach(exportedVariableStatement => {
        const declarations = exportedVariableStatement.getDeclarations();
        declarations.forEach(declaration => {
            console.log(`Exported variable ${declaration.getName()}, source file ${exportedVariableStatement.getSourceFile().getFilePath().split('/').pop()!}`);
        });
    });

    // find the list of exported functions
    const exportedFunctions = project.getSourceFiles().map(sourceFile => {
        const functionDeclarations = sourceFile.getFunctions();
        return functionDeclarations.filter(declaration => declaration.hasExportKeyword());
    }).flat();

    // output the exported functions
    exportedFunctions.forEach(exportedFunction => {
        console.log(`Exported function ${exportedFunction.getName()}, source file ${exportedFunction.getSourceFile().getFilePath().split('/').pop()!}`);
    });

    // find the list of exported enums
    const exportedEnums = project.getSourceFiles().map(sourceFile => {
        const enumDeclarations = sourceFile.getEnums();
        return enumDeclarations.filter(declaration => declaration.hasExportKeyword());
    }).flat();

    // output the exported enums
    exportedEnums.forEach(exportedEnum => {
        console.log(`Exported enum ${exportedEnum.getName()}, source file ${exportedEnum.getSourceFile().getFilePath().split('/').pop()!}`);
    });

    type ExporteElementTSMorph = VariableStatement | FunctionDeclaration | EnumDeclaration;
    const exportedElementsTSMorph = [...exportedVariables, ...exportedFunctions, ...exportedEnums];
    const elementAliases = new Map<ExporteElementTSMorph, NameAlias[]>();

    // find the list of exported aliased symbols (e.g. export { foo as renamedFoo })
    const exportedAliasedSymbols = project.getSourceFiles()
        .map(sourceFile => sourceFile.getExportDeclarations()
            .map(exportDeclaration => exportDeclaration.getNamedExports())).flat().flat();

    // output the exported aliased symbols
    exportedAliasedSymbols.forEach(exportedAliasedSymbol => {
        console.log(`Exported aliased symbol ${exportedAliasedSymbol.getName()}, alias ${exportedAliasedSymbol.getAliasNode()?.getText()}, source file ${exportedAliasedSymbol.getSourceFile().getFilePath().split('/').pop()!}`);
    });

    // find the list of imported symbols
    const importedSymbols = project.getSourceFiles().map(sourceFile => sourceFile.getImportDeclarations().map(importDeclaration => importDeclaration.getNamedImports())).flat().flat();

    // populate the elementAliases map from exported symbols
    exportedElementsTSMorph.forEach(exportedElement => {
        // find the name of the exported element - it's different according to its type
        let exportedElementName: string;
        if (exportedElement.getKind() === ts.SyntaxKind.VariableStatement) {
            exportedElementName = (exportedElement as VariableStatement).getDeclarations()[0].getName();
        } else if (exportedElement.getKind() === ts.SyntaxKind.FunctionDeclaration) {
            exportedElementName = (exportedElement as FunctionDeclaration).getName()!;
        } else if (exportedElement.getKind() === ts.SyntaxKind.EnumDeclaration) {
            exportedElementName = (exportedElement as EnumDeclaration).getName();
        } else {
            throw new Error('Unknown exported element type');
        }
        const aliases = exportedAliasedSymbols.filter(aliasedExportedSymbol => aliasedExportedSymbol.getName() === exportedElementName);
        elementAliases.set(exportedElement, aliases.map(alias => {
            return { alias: alias.getAliasNode()!.getText(), sourceFile: alias.getSourceFile(), renamedOn: 'export' };
        }
        ));
    });

    // find the list of aliased imported symbols
    const renamedImportedSymbols = importedSymbols.filter(importedSymbol => importedSymbol.getAliasNode() !== undefined);

    // output the renamed imported symbols
    renamedImportedSymbols.forEach(renamedImportedSymbol => {
        console.log(`Renamed imported symbol ${renamedImportedSymbol.getName()}, alias ${renamedImportedSymbol.getAliasNode()?.getText()}, source file ${renamedImportedSymbol.getSourceFile().getFilePath().split('/').pop()!}`);
    });

    // populate the elementAliases map from imported symbols
    renamedImportedSymbols.forEach(renamedImportedSymbol => {
        console.log(`Checking renamed imported symbol ${renamedImportedSymbol.getName()}...`);
        const alias = renamedImportedSymbol.getAliasNode()!.getText();
        console.log(`    alias is ${alias} in source file ${renamedImportedSymbol.getSourceFile().getBaseName()}`);
        const sourceFile = renamedImportedSymbol.getSourceFile();
        let exportedElement = exportedElementsTSMorph.find(exportedElement => {
            // find the name of the exported element - it's different according to its type
            let exportedElementName: string;
            if (exportedElement.getKind() === ts.SyntaxKind.VariableStatement) {
                exportedElementName = (exportedElement as VariableStatement).getDeclarations()[0].getName();
            } else if (exportedElement.getKind() === ts.SyntaxKind.FunctionDeclaration) {
                exportedElementName = (exportedElement as FunctionDeclaration).getName()!;
            } else if (exportedElement.getKind() === ts.SyntaxKind.EnumDeclaration) {
                exportedElementName = (exportedElement as EnumDeclaration).getName();
            } else {
                throw new Error('Unknown exported element type');
            }
            return exportedElementName === renamedImportedSymbol.getName();
        });
        if (exportedElement === undefined) {
            // search for its name as an alias
            exportedElement = exportedElementsTSMorph.find(exportedElement => {
                const aliases = elementAliases.get(exportedElement)!;
                return aliases.some(alias => alias.alias === renamedImportedSymbol.getName());
            });
        }
        if (exportedElement) {
            const aliases = elementAliases.get(exportedElement)!;
            aliases.push({ alias, sourceFile, renamedOn: 'import' });
        } else {
            throw new Error(`Could not find exported element for renamed imported symbol ${renamedImportedSymbol.getName()}`);
        }
    });

    // add to the elementAliases map from re-exported symbols


    // output the map
    elementAliases.forEach((aliases, exportedElement) => {
        console.log(`Exported element ${exportedElement.getText()}, aliases:`);
        aliases.forEach(alias => {
            console.log(`    ${alias.alias}, source file ${alias.sourceFile.getFilePath().split('/').pop()!}, direction ${alias.renamedOn}`);
        });
    });

    // for each element, we can have a list of aliases
    // const exportedElementsAliases = new Map<ExporteElementTSMorph, NameAlias[]>();

    // output the aliased exported symbols
    exportedAliasedSymbols.forEach(aliasedExportedSymbol => {
        console.log(`Aliased exported symbol ${aliasedExportedSymbol.getName()}, alias ${aliasedExportedSymbol.getAliasNode()?.getText()}, source file ${aliasedExportedSymbol.getSourceFile().getFilePath().split('/').pop()!}`);
    });

    // output the aliased imported symbols
    renamedImportedSymbols.forEach(aliasedImportedSymbol => {
        console.log(`Aliased imported symbol ${aliasedImportedSymbol.getName()}, alias ${aliasedImportedSymbol.getAliasNode()?.getText()}, source file ${aliasedImportedSymbol.getSourceFile().getFilePath().split('/').pop()!}`);
    });

    // for each exportedElement, create an instance of ExportedElement and add it to the exportedElements list
    exportedElementsTSMorph.forEach(exportedElement => {
        const exportedElementInstance = new ExportedElement();
        // get the name, but it's different for each type
        if (exportedElement.getKind() === ts.SyntaxKind.VariableStatement) {
            exportedElementInstance.name = (exportedElement as VariableStatement).getDeclarations()[0].getName();
        } else if (exportedElement.getKind() === ts.SyntaxKind.FunctionDeclaration) {
            exportedElementInstance.name = (exportedElement as FunctionDeclaration).getName()!;
        } else if (exportedElement.getKind() === ts.SyntaxKind.EnumDeclaration) {
            exportedElementInstance.name = (exportedElement as EnumDeclaration).getName();
        } else {
            throw new Error('Unknown exported element type');
        }
        exportedElementInstance.sourceFile = exportedElement.getSourceFile();
        if (exportedElement.getKind() === ts.SyntaxKind.VariableStatement) {
            exportedElementInstance.type = 'variable';
        } else if (exportedElement.getKind() === ts.SyntaxKind.FunctionDeclaration) {
            exportedElementInstance.type = 'function';
        } else if (exportedElement.getKind() === ts.SyntaxKind.EnumDeclaration) {
            exportedElementInstance.type = 'enum';
        } else {
            throw new Error('Unknown exported element type');
        }
        exportedElementInstance.aliases = elementAliases.get(exportedElement)!;
        exportedElements.push(exportedElementInstance);
    });

    return exportedElements;

}


export function createProject() {
    const project = new Project();

    const sourceFiles = [
        {
            name: 'namedExports.ts',
            code: `export const foo = 42;
`
        },
//         {
//             name: 'renamedExport.ts',
//             code: `const foo = 42;
// export { foo as renamedFoo };
// `
//         },
        {
            name: 'importRenamed.ts',
            code: `import { foo as importRenamedFoo } from './namedExports';
`
        },
        {
            name: 'reexportNamedExport.ts',
            code: `export { foo as exportRenamedFoo } from './namedExports';
`
        },
        {
            name: 'importRenamedNamedExport.ts',
            code: `import { exportRenamedFoo as importRenamedFoo } from './reexportNamedExport';
`
        }
    ];

    for (const sourceFile of sourceFiles) {
        project.createSourceFile(sourceFile.name, sourceFile.code);
    }

    return project;
}


// function to output a DOT graph of the elements and their aliases
function outputDOTGraph(exportedElements: ExportedElement[]) {
    console.log('@startdot\ndigraph a {');
    const sourceFiles = new Set<SourceFile>();
    exportedElements.forEach(exportedElement => {
        sourceFiles.add(exportedElement.sourceFile);
        exportedElement.aliases.forEach(alias => {
            sourceFiles.add(alias.sourceFile);
            const color = alias.renamedOn === 'export' ? 'red' : 'black';
            console.log(`    "${exportedElement.sourceFile.getFilePath().split('/').pop()!}":${exportedElement.name} -> "${alias.sourceFile.getFilePath().split('/').pop()!}":${alias.alias} [label="${exportedElement.name} ${alias.renamedOn}ed as\\l${alias.alias}", color="${color}"]`);
        });
    });
//    console.log('    subgraph cluster_legend {');
//    console.log('        label="Legend";');
    console.log('        labeljust="l";');
    // console.log('        labelloc="t";');
    // console.log('        fontname="Courier";');
    // console.log('        fontsize=10;');
    // console.log('        node [fontname="Courier", fontsize=10, align=left];'); // updated line
    sourceFiles.forEach(sourceFile => {
        console.log(`    "${sourceFile.getFilePath().split('/').pop()!}" [shape=rect, label=<<B>${sourceFile.getBaseName()}</B><BR ALIGN="LEFT"/>${sourceFile.getFullText().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<BR ALIGN="LEFT"/>')}>, fontname="Courier", fontsize=10];`);
    });
//    console.log('    }');
    console.log('}\n@enddot');
}


const result = doIt(createProject());

// output the result showing all aliases in human-readable format
console.log('Result:');
result.forEach(exportedElement => {
    console.log(`Exported element ${exportedElement.name}, type ${exportedElement.type}, source file ${exportedElement.sourceFile.getFilePath().split('/').pop()!}, aliases:`);
    exportedElement.aliases.forEach(alias => {
        console.log(`    ${alias.alias}, ${alias.renamedOn}ed, source file ${alias.sourceFile.getFilePath().split('/').pop()!}`);
    });
});

// make the graph
outputDOTGraph(result);