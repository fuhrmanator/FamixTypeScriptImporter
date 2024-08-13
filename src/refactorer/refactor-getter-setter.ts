import { Project, SyntaxKind } from "ts-morph";
import * as path from "path";

const project = new Project();
project.addSourceFilesAtPaths("src/lib/famix/src/model/famix/source_anchor.ts");
project.getSourceFiles().forEach(sourceFile => { console.log(sourceFile.getFilePath()); });

project.getSourceFiles().forEach(sourceFile => {
    const typeMap = createTypeMap(sourceFile);

    const classes = sourceFile.getClasses();
    classes.forEach(cls => {
        const properties = cls.getProperties();
        cls.getMethods().forEach(method => {
            const methodName = method.getName();
            let propName: string;

            if (isEligibleGetter(methodName)) {
                propName = methodName.charAt(3).toLowerCase() + methodName.slice(4);
                renamePropertyIfExists(cls, propName, properties);
                refactorToGetter(cls, method, propName, typeMap);
                replaceMethodCalls(cls, `get${capitalize(propName)}`, propName);
            } else if (isEligibleSetter(methodName)) {
                propName = methodName.charAt(3).toLowerCase() + methodName.slice(4);
                renamePropertyIfExists(cls, propName, properties);
                refactorToSetter(cls, method, propName, typeMap);
                replaceMethodCalls(cls, `set${capitalize(propName)}`, propName);
            }
        });
    });
});

project.save().then(() => {
    console.log("Refactoring complete!");
});

function isEligibleGetter(methodName: string): boolean {
    return methodName.startsWith("get") && /^[A-Z][a-zA-Z0-9]*$/.test(methodName.slice(3)) && !methodName.includes("JSON");
}

function isEligibleSetter(methodName: string): boolean {
    return methodName.startsWith("set") && /^[A-Z][a-zA-Z0-9]*$/.test(methodName.slice(3));
}

function renamePropertyIfExists(cls: any, propName: string, properties: any[]) {
    const existingProperty = properties.find(prop => prop.getName() === propName);
    if (existingProperty) {
        existingProperty.rename(`_${propName}`);
    }
}

function createTypeMap(sourceFile: any): Map<string, string> {
    const typeMap = new Map<string, string>();
    const importDeclarations = sourceFile.getImportDeclarations();

    importDeclarations.forEach(importDecl => {
        const moduleSpecifier = importDecl.getModuleSpecifier().getText().replace(/['"]/g, '');
        const absolutePath = path.resolve(sourceFile.getDirectory().getPath(), moduleSpecifier);
        const normalizedPath = normalizePath(absolutePath);
        const namedImports = importDecl.getNamedImports();
        const defaultImport = importDecl.getDefaultImport();

        namedImports.forEach(namedImport => {
            console.log(`Named import: ${namedImport.getName()}, path: ${normalizedPath}`);
            typeMap.set(namedImport.getName(), normalizedPath);
        });

        if (defaultImport) {
            typeMap.set(defaultImport.getText(), normalizedPath);
        }
    });

    return typeMap;
}

function refactorToGetter(cls: any, method: any, propName: string, typeMap: Map<string, string>) {
    const getterName = propName;
    const renamedProp = `_${propName}`;
    const returnType = method.getReturnType().getText();
    const simplifiedType = replaceLongTypePaths(returnType, typeMap);

    const getterBody = method.getBodyText().replace(new RegExp(`this\\.${propName}`, 'g'), `this.${renamedProp}`);

    cls.addGetAccessor({
        name: getterName,
        statements: getterBody,
        // returnType: simplifiedType,  // don't need a return type for getter
    });

    method.remove();
}

function refactorToSetter(cls: any, method: any, propName: string, typeMap: Map<string, string>) {
    const setterName = propName;
    const renamedProp = `_${propName}`;

    const parameter = method.getParameters()[0];
    const paramName = parameter.getName();
    const paramType = replaceLongTypePaths(parameter.getType().getText(), typeMap);

    const setterBody = method.getBodyText().replace(new RegExp(`this\\.${propName}`, 'g'), `this.${renamedProp}`);

    cls.addSetAccessor({
        name: setterName,
        statements: setterBody,
        parameters: [{ name: paramName, type: paramType }],
    });

    method.remove();
}

function replaceLongTypePaths(type: string, typeMap: Map<string, string>): string {
    for (const [importName, importPath] of typeMap.entries()) {
        const longPath = `import("${importPath}")${importName}`;
        const regex = new RegExp(`import\\(["']${normalizePath(importPath)}["']\\)\\.${importName}`, 'g');
        if (regex.test(type)) {
            return importName;
        }
    }
    return type;
}

function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

function replaceMethodCalls(cls: any, methodName: string, propName: string) {
    cls.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
        const expr = callExpr.getExpression();
        if (expr.getText() === `this.${methodName}`) {
            callExpr.replaceWithText(`this.${propName}`);
        } else if (expr.getText() === `this.${methodName}` && callExpr.getArguments().length > 0) {
            callExpr.replaceWithText(`this.${propName} = ${callExpr.getArguments()[0].getText()}`);
        }
    });
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
