import { logger } from "../analyze";

export function convertToRelativePath(absolutePath: string, absolutePathProject: string) {
    logger.debug(`convertToRelativePath: absolutePath: '${absolutePath}', absolutePathProject: '${absolutePathProject}'`);
    if (absolutePath.startsWith(absolutePathProject)) {
        return absolutePath.replace(absolutePathProject, "").slice(1);
    } else if (absolutePath.startsWith("/")) {
        return absolutePath.slice(1);
    } else {
        return absolutePath;
    }
}