import {
    createConnection,
} from 'vscode-languageserver/node';
import { FamixRepository } from 'ts2famix';
import * as fs from "fs";
import path from 'path';
import { getOutputFilePath } from '../utils';
import { err, ok, Result } from 'neverthrow';

export class FamixModelExporter {
    private _connection: ReturnType<typeof createConnection>;

    constructor(connection: ReturnType<typeof createConnection>) {
        this._connection = connection;
    }
	
    public async exportModelToFile(famixRep: FamixRepository): Promise<Result<void, Error>> {
        const jsonFilePath = await getOutputFilePath(this._connection);
        if (!jsonFilePath) {
            return err(new Error('No output file path provided for model generation.'));
        }

        const jsonOutput = famixRep.export({ format: "json" });

        const outputDir = path.dirname(jsonFilePath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        await fs.promises.writeFile(jsonFilePath, jsonOutput);
        return ok();
    }
}