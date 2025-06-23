 
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
    const baseUrl = params.filePath;
    if (!baseUrl) {
      connection.console.error('No filePath provided for model generation.');
      return;
    }
    
    const tsConfigFilePath = baseUrl.endsWith(tsConfigFileExtension)
      ? baseUrl
      : path.join(baseUrl, tsConfigFileExtension);

    const jsonOutput = generateModelForProject(tsConfigFilePath, baseUrl);
    
    const jsonFilePath = await getOutputFilePath(connection);
    if (!jsonFilePath) {
      connection.console.error('No output file path provided for model generation.');
      return;
    }

    fs.writeFile(jsonFilePath, jsonOutput, (err) => {
      if (err) { throw err; }
    });
  });
};
