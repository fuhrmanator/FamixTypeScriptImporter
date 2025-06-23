import * as vscode from 'vscode';
import path from 'path';
import * as fs from 'fs';

export const getBaseUrl = (document: vscode.TextDocument) => {
	// NOTE: won't work if the root folder is not a workspace folder
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
	if (workspaceFolder) {
		const tsConfigPath = path.join(workspaceFolder.uri.fsPath, 'tsconfig.json');
		if (fs.existsSync(tsConfigPath)) {
			const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
			const baseUrl = tsConfig.compilerOptions?.baseUrl
				? path.resolve(workspaceFolder.uri.fsPath, tsConfig.compilerOptions.baseUrl)
				: workspaceFolder.uri.fsPath;
			return baseUrl;
		}
	}
	return undefined;
};