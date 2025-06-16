import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	TextDocumentSyncKind,
} from 'vscode-languageserver/node';

import { Importer, FamixRepository } from 'ts2famix';

import * as fs from "fs";

import {
	TextDocument
} from 'vscode-languageserver-textdocument';


// Creates the LSP connection
const connection = createConnection(ProposedFeatures.all);

// Create a manager for open text documents
const documents = new TextDocuments(TextDocument);

// The workspace folder this server is operating on
let workspaceFolder: string | null;

documents.onDidOpen((event) => {
	connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Document opened: ${event.document.uri}`);
});
documents.listen(connection);

connection.onInitialize((params) => {
	workspaceFolder = params.rootUri;
	connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Started and initialize received`);

	const input = "C:\\Users\\ACER\\Projects\\moose\\Emojiopoly\\src\\app.ts";
	const jsonFilePath = 'C:\\Users\\ACER\\Projects\\FamixTypeScriptImporter\\vscode-extension\\JSONModels\\app.json';

	const importer = new Importer();

	const paths = new Array<string>();
	paths.push(input as string);
	const famixRep: FamixRepository = importer.famixRepFromPaths(paths);
	const jsonOutput = famixRep.export({format: "json"});

	fs.writeFile(jsonFilePath, jsonOutput, (err) => {
		if (err) { throw err; }
	});

	return {
		capabilities: {
			textDocumentSync: {
				openClose: true,
				change: TextDocumentSyncKind.None
			}
		}
	};
});
connection.listen();
