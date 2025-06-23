import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	TextDocumentSyncKind,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { registerCommandHandlers } from './commandHandlers';

const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments(TextDocument);

documents.listen(connection);

connection.onInitialize(() => {
	connection.console.log(`[Server(${process.pid})] Started and initialize received`);

	return {
		capabilities: {
			textDocumentSync: {
				openClose: true,
				change: TextDocumentSyncKind.None
			}
		}
	};
});

registerCommandHandlers(connection);

connection.listen();
