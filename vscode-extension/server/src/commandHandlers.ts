 
import {
    createConnection,
} from 'vscode-languageserver/node';
import { getOutputFilePath } from './utils';
import { generateModelForProject } from 'ts2famix';
import * as fs from "fs";
import path from 'path';

interface GenerateModelForProjectParams {
    filePath: string;
}

const methodName = 'generateModelForProject';
const tsConfigFileExtension = 'tsconfig.json';

export const registerCommandHandlers = (connection: ReturnType<typeof createConnection>) => {
    connection.onRequest(methodName, async (params: GenerateModelForProjectParams) => {
        try {
            const baseUrl = params.filePath;
            if (!baseUrl) {
                connection.console.error('No filePath provided for model generation.');
                return { success: false, error: 'No filePath provided' };
            }
      
            const tsConfigFilePath = baseUrl.endsWith(tsConfigFileExtension)
                ? baseUrl
                : path.join(baseUrl, tsConfigFileExtension);

            const jsonOutput = generateModelForProject(tsConfigFilePath, baseUrl);
      
            const jsonFilePath = await getOutputFilePath(connection);
            if (!jsonFilePath) {
                connection.console.error('No output file path provided for model generation.');
                return { success: false, error: 'No output file path configured' };
            }

            connection.console.log(`Writing model to ${jsonFilePath}`);
      
            // TODO: consider adding the integration tests for this
            const outputDir = path.dirname(jsonFilePath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            await fs.promises.writeFile(jsonFilePath, jsonOutput);
      
            return { success: true, outputPath: jsonFilePath };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            connection.console.error(`Error generating model: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    });
};
