 
import {
    createConnection,
    ErrorCodes,
    ResponseError,
    ResponseMessage,
} from 'vscode-languageserver/node';
import { findTypeScriptProject } from './utils';
import { getTsMorphProject } from 'ts2famix';
import { FamixProjectManager } from './model';

const methodName = 'generateModelForProject';

// Note: format for response is based on LSP specification:
// https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#responseMessage
export const registerCommandHandlers = (connection: ReturnType<typeof createConnection>, famixProjectManager: FamixProjectManager) => {
    connection.onRequest(methodName, async (): Promise<ResponseMessage> => {
        const getErrorResponse = (errorCode: number, message: string): ResponseMessage => ({
            jsonrpc: '2.0',
            id: null,
            error: new ResponseError(errorCode, message, message)
        });
        try {
            const result = await findTypeScriptProject(connection);
            if (result.isErr()) {
                return getErrorResponse(ErrorCodes.InvalidRequest, result.error.message);
            }
            const { tsConfigPath, baseUrl } = result.value;
            const tsMorphProject = getTsMorphProject(tsConfigPath, baseUrl);
            const modelGenerationResult = await famixProjectManager.generateFamixModelFromScratch(tsMorphProject);
            if (modelGenerationResult.isErr()) {
                return getErrorResponse(ErrorCodes.InternalError, modelGenerationResult.error.message);
            }
            return { 
                jsonrpc: '2.0',
                id: null,
                result: null };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            connection.console.error(`Error generating model: ${errorMessage}`);
            return getErrorResponse(ErrorCodes.InternalError, errorMessage);
        }
    });
};
