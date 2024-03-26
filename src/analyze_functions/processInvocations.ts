import { MethodDeclaration, FunctionDeclaration, Identifier, ConstructorDeclaration, GetAccessorDeclaration, SetAccessorDeclaration, FunctionExpression } from "ts-morph";
import * as FamixFunctions from "../famix_functions/famix_object_creator";
import { logger } from "../analyze";

/**
 * This class is used to build a Famix model for the invocations
 */
export class ProcessInvocations {

    /**
     * Builds a Famix model for the invocations of the methods and functions of the source files
     * @param methodsAndFunctionsWithId A map of methods and functions with their id
     */
    public processInvocations(methodsAndFunctionsWithId: Map<number, MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression>): void {
        logger.info(`Creating invocations:`);
        methodsAndFunctionsWithId.forEach((m, id) => {
            logger.debug(`Invocations to ${(m instanceof MethodDeclaration || m instanceof GetAccessorDeclaration || m instanceof SetAccessorDeclaration || m instanceof FunctionDeclaration) ? m.getName() : ((m instanceof ConstructorDeclaration) ? 'constructor' : (m.getName() ? m.getName() : 'anonymous'))}`);
            try {
                const temp_nodes = m.findReferencesAsNodes() as Array<Identifier>;
                temp_nodes.forEach(node => this.processNodeForInvocations(node, m, id));
            } catch (error) {
                logger.error(`> WARNING: got exception ${error}. Continuing...`);
            }
        });
    }

    /**
     * Builds a Famix model for an invocation of a method or a function
     * @param n A node
     * @param m A method or a function
     * @param id The id of the method or the function
     */
    private processNodeForInvocations(n: Identifier, m: MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | FunctionDeclaration | FunctionExpression, id: number): void {
        try {
            FamixFunctions.createFamixInvocation(n, m, id);

            logger.debug(`node: node, (${n.getType().getText()})`);
        } catch (error) {
            logger.error(`> WARNING: got exception ${error}. ScopeDeclaration invalid for ${n.getSymbol().getFullyQualifiedName()}. Continuing...`);
        }
    }
}
