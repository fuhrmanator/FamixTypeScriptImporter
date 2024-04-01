import { ClassDeclaration, InterfaceDeclaration, SourceFile, ImportDeclaration, ExpressionWithTypeArguments} from "ts-morph";

/**
 * Checks if the file has any imports or exports to be considered a module
 * @param sourceFile A source file
 * @returns A boolean indicating if the file is a module
 */
export function isModule(sourceFile: SourceFile): boolean {
    return sourceFile.getImportDeclarations().length > 0 || sourceFile.getExportedDeclarations().size > 0;
}

/**
 * Gets the path of a module to be imported
 * @param i An import declaration
 * @returns The path of the module to be imported
 */
export function getModulePath(i: ImportDeclaration): string {
    let path: string;
    if (i.getModuleSpecifierSourceFile() === undefined) {
        if (i.getModuleSpecifierValue().substring(i.getModuleSpecifierValue().length - 3) === ".ts") {
            path = i.getModuleSpecifierValue();
        }
        else {
            path = i.getModuleSpecifierValue() + ".ts";
        }
    }
    else {
        path = i.getModuleSpecifierSourceFile().getFilePath();
    }
    return path;
}

/**
 * Gets the interfaces implemented or extended by a class or an interface
 * @param interfaces An array of interfaces
 * @param subClass A class or an interface
 * @returns An array of InterfaceDeclaration and ExpressionWithTypeArguments containing the interfaces implemented or extended by the subClass
 */
export function getImplementedOrExtendedInterfaces(interfaces: Array<InterfaceDeclaration>, subClass: ClassDeclaration | InterfaceDeclaration): Array<InterfaceDeclaration | ExpressionWithTypeArguments> {
    let impOrExtInterfaces: Array<ExpressionWithTypeArguments>;
    if (subClass instanceof ClassDeclaration) {
        impOrExtInterfaces = subClass.getImplements();
    }
    else {
        impOrExtInterfaces = subClass.getExtends();
    }

    const interfacesNames = interfaces.map(i => i.getName());
    const implementedOrExtendedInterfaces = new Array<InterfaceDeclaration | ExpressionWithTypeArguments>();

    impOrExtInterfaces.forEach(i => {
        if (interfacesNames.includes(i.getExpression().getText())) {
            implementedOrExtendedInterfaces.push(interfaces[interfacesNames.indexOf(i.getExpression().getText())]);
        }
        else {
            implementedOrExtendedInterfaces.push(i);
        }
    });

    return implementedOrExtendedInterfaces;
}