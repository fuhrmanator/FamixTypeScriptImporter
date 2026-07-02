export { Importer, logger, config, SourceFileChangeType} from "./analyze";
//export { Importer, config, SourceFileChangeType} from "./analyze";
export { FamixRepository } from "./lib/famix/famix_repository";
export { FamixBaseElement } from "./lib/famix/famix_base_element";
export * from './helpers';

import { Project } from 'ts-morph';
import { logger } from "./analyze";

export const getTsMorphProject = (tsConfigFilePath: string, baseUrl: string) => {
    logger.info('Initializing ts-morph project');
    return new Project({
        tsConfigFilePath,
        compilerOptions: {
            baseUrl,
        }
    });// le main doit etre le point de départ
};