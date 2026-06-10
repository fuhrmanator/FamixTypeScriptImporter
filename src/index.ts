export { Importer, logger, config, SourceFileChangeType} from "./analyze";
export { FamixRepository } from "./lib/famix/famix_repository";
export { FamixBaseElement } from "./lib/famix/famix_base_element";
export * from './helpers';

import { Project } from 'ts-morph';

export const getTsMorphProject = (tsConfigFilePath: string, baseUrl: string) => {
    return new Project({
        tsConfigFilePath,
        compilerOptions: {
            baseUrl: baseUrl,
        }
    });
};