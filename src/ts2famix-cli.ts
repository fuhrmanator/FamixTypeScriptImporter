#!/usr/bin/env node
import * as fs from "fs";
import yargs from "yargs";
import { Importer } from './analyze';
import { FamixRepository } from "./lib/famix/src/famix_repository";
import { Project } from "ts-morph";
import { config } from "./analyze";

const argv = yargs
    .example(`ts2famix -i "path/to/project/**/*.ts" -o JSONModels/projectName.json`, 'Creates a JSON-format Famix model of typescript files.')
    .example(`ts2famix -i path/to/tsconfig.json -o JSONModels/projectName.json`, 'Creates a JSON-format model of a typescript project.')
    .alias('i', 'input')
    .nargs('i', 1)
    .alias('o', 'output')
    .nargs('o', 1)
    .alias('l', 'loglevel')
    .nargs('l', 1)
    .default('l', 3)
    .describe('l', 'Set minimum logging level 0: silly, 1: trace, 2: debug, 3: info, 4: warn, 5: error, 6: fatal')
    .boolean('graphemes')
    .default('graphemes', false)
    .describe('graphemes', 'Process graphemes (outside of the BMP) to avoid source anchor offset errors (due to performance issues, this is disabled by default)')
    .demandOption('input')
    .demandOption('output')
    .parseSync();

import { logger } from './analyze';
logger.settings.minLevel = Number(argv.loglevel) as number;
config.expectGraphemes = argv.graphemes as boolean;

const importer = new Importer();
let famixRep: FamixRepository;

if ((argv.input as string).endsWith('tsconfig.json')) {
    const tsConfigFilePath = argv.input as string;
    const project = new Project({
        tsConfigFilePath
      }); 
    famixRep = importer.famixRepFromProject(project);
} else {
    const paths = new Array<string>();
    paths.push(argv.input as string);
    famixRep = importer.famixRepFromPaths(paths);
}

const jsonOutput = famixRep.export({format: "json"});
const jsonFilePath = argv.output as string;

fs.writeFile(jsonFilePath, jsonOutput, (err) => {
    if (err) { throw err; }
});

logger.info(`Created: ${jsonFilePath}`); 
