import {
    createConnection,
} from 'vscode-languageserver/node';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { err, ok, Result } from 'neverthrow';
import { ts } from 'ts-morph';

const extensionSectionName = 'ts2famix';
const tsConfigFileExtension = 'tsconfig.json';

export async function getOutputFilePath(connection: ReturnType<typeof createConnection>): Promise<string> {
    const config = await connection.workspace.getConfiguration({ section: extensionSectionName });
    return config.FamixModelOutputFilePath || '';
}

export async function findTypeScriptProject(connection: ReturnType<typeof createConnection>
): Promise<Result<{ tsConfigPath: string, baseUrl: string }, Error>> {
    const workspaceFolders = await connection.workspace.getWorkspaceFolders();
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return err(new Error('No workspace folders found'));
    }
    const baseUrl = url.fileURLToPath(workspaceFolders[0].uri);
    const tsConfigPath = getTsConfigFilePath(baseUrl);
        
    // TODO: Should we scan all workspace folders? Should we check inner folders?
    if (!fs.existsSync(tsConfigPath)) {
        return err(new Error(`TypeScript configuration file not found: ${tsConfigPath}`));
    }
        
    return ok({ 
        tsConfigPath: tsConfigPath,
        baseUrl: baseUrl
    });
}

export function getTsConfigFilePath(baseUrl: string): string {
    return baseUrl.endsWith(tsConfigFileExtension)
        ? baseUrl
        : path.join(baseUrl, tsConfigFileExtension);
}

export function createGlobPatternsToWatch() {
    // TODO: use tsconfig to get the include patterns
    return "{**/*.ts,**/*d.ts,**/tsconfig.json}";
}

export function createExcludeGlobPatternsFromTsConfig(tsConfigPath: string) {
    const { exclude } = getCompilerPatterns(tsConfigPath);
    if (exclude.length === 0) {
        return [];
    }

    const getFilesPatternsForDirectory = (dirPattern: string) => {
        const isDirectory = !dirPattern.includes('*');
        if (isDirectory) {
            // TODO: get the project root and make the path relative to it instead of using **/
            return `**/${dirPattern}/**/*`;
        } else {
            // it's already a glob
            return dirPattern;
        }
    };

    return exclude.map(pattern => getFilesPatternsForDirectory(pattern));
}

function getCompilerPatterns(configPath: string) {
    const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
        configPath, {}, ts.sys as never
    );
    if (!parsedCommandLine) {
        throw new Error("Could not parse tsconfig.json.");
    }

    const rawConfig = parsedCommandLine.raw;
    const include: string[] = rawConfig.include ?? [] as string[];
    const files: string[] = rawConfig.files ?? [] as string[];
    const outputDir = parsedCommandLine.options.outDir;
    const exclude: string[] = rawConfig.exclude ?? [
        "node_modules",
        ...(outputDir ? [outputDir] : [])
    ];
    
    return { include, files, exclude };
}
