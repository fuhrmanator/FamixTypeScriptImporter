import { convertToRelativePath } from "../famix_functions/helpers_path";
import path from "path";

export const getFamixIndexFileAnchorFileName = (absolutePath: string, absolutePathProject: string) => {
    absolutePath = path.normalize(absolutePath);
    const positionNodeModules = absolutePath.indexOf('node_modules');

    let pathInProject: string = "";

    if (positionNodeModules !== -1) {
        const pathFromNodeModules = absolutePath.substring(positionNodeModules);
        pathInProject = pathFromNodeModules;
    } else {
        pathInProject = convertToRelativePath(absolutePath, absolutePathProject);
    }

    // revert any backslashes to forward slashes (path.normalize on windows introduces them)
    pathInProject = pathInProject.replace(/\\/g, "/");

    if (pathInProject.startsWith("/")) {
        pathInProject = pathInProject.substring(1);
    }
    return pathInProject;
};
