import { ClassDeclaration, InterfaceDeclaration, ExpressionWithTypeArguments } from "ts-morph";
import * as FamixFunctions from "../famix_functions/famix_object_creator";
import { logger } from "../analyze";

/**
 * This class is used to build a Famix model for the inheritances
 */
export class ProcessInheritances {

    /**
     * Builds a Famix model for the inheritances of the classes and interfaces of the source files
     * @param classes An array of classes
     * @param interfaces An array of interfaces
     */
    public processInheritances(classes: ClassDeclaration[], interfaces: InterfaceDeclaration[]): void {
        logger.info(`processInheritances: Creating inheritances:`);
        classes.forEach(cls => {
            logger.debug(`processInheritances: Checking class inheritance for ${cls.getName()}`);
            const extClass = cls.getBaseClass();
            if (extClass !== undefined) {
                FamixFunctions.createFamixInheritance(cls, extClass);
                
                logger.debug(`processInheritances: class: ${cls.getName()}, (${cls.getType().getText()}), extClass: ${extClass.getName()}, (${extClass.getType().getText()})`);
            }

            logger.debug(`processInheritances: Checking interface inheritance for ${cls.getName()}`);
            const implementedInterfaces = this.getImplementedOrExtendedInterfaces(interfaces, cls);
            implementedInterfaces.forEach(impInter => {
                FamixFunctions.createFamixInheritance(cls, impInter);

                logger.debug(`processInheritances: class: ${cls.getName()}, (${cls.getType().getText()}), impInter: ${(impInter instanceof InterfaceDeclaration) ? impInter.getName() : impInter.getExpression().getText()}, (${(impInter instanceof InterfaceDeclaration) ? impInter.getType().getText() : impInter.getExpression().getText()})`);
            });
        });

        interfaces.forEach(inter => {
            logger.debug(`processInheritances: Checking interface inheritance for ${inter.getName()}`);
            const extendedInterfaces = this.getImplementedOrExtendedInterfaces(interfaces, inter);
            extendedInterfaces.forEach(extInter => {
                FamixFunctions.createFamixInheritance(inter, extInter);

                logger.debug(`processInheritances: inter: ${inter.getName()}, (${inter.getType().getText()}), extInter: ${(extInter instanceof InterfaceDeclaration) ? extInter.getName() : extInter.getExpression().getText()}, (${(extInter instanceof InterfaceDeclaration) ? extInter.getType().getText() : extInter.getExpression().getText()})`);
            });
        });
    }

    /**
     * Gets the interfaces implemented or extended by a class or an interface
     * @param interfaces An array of interfaces
     * @param subClass A class or an interface
     * @returns An array of InterfaceDeclaration and ExpressionWithTypeArguments containing the interfaces implemented or extended by the subClass
     */
    private getImplementedOrExtendedInterfaces(interfaces: Array<InterfaceDeclaration>, subClass: ClassDeclaration | InterfaceDeclaration): Array<InterfaceDeclaration | ExpressionWithTypeArguments> {
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
}
