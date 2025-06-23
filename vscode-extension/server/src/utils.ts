import {
	createConnection,
} from 'vscode-languageserver/node';

const extensionSectionName = 'ts2famix';

export async function getOutputFilePath(connection: ReturnType<typeof createConnection>): Promise<string> {
  const config = await connection.workspace.getConfiguration({ section: extensionSectionName });
  return config.outputFilePath || '';
}