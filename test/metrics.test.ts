import { Project } from 'ts-morph';
import { Importer } from '../src/analyze';
import * as fs from 'fs';

const importer = new Importer();
const project = new Project(
    {
        compilerOptions: {
            baseUrl: "./test_src"
        }
    }
);

// Note: metrics test is tricky because we must create the file on disk

const sourcePath = "./test_src/metrics.ts";
// remove file if it already exists
if (fs.existsSync(sourcePath)) {
    // Delete the existing file
    fs.unlinkSync(sourcePath);
}

const sourceFile = project.createSourceFile(sourcePath,
`class ForMetrics {
    public methodCyclomaticOne() {}
    
    public methodCyclomaticFour() {
        // make higher cyclomatic complexity
        for (let i = 0; i < 50; i++) { // 2
            for (let j = 0; j < 50; j++) { // 3
                if (i < 10) {} // 4
            }
        }
    }
}

function functionCyclomaticOne() {}

function functionCyclomaticFour() {
    // make higher cyclomatic complexity
    for (let i = 0; i < 50; i++) { // 2
        for (let j = 0; j < 50; j++) { // 3
            if (i < 10) {} // 4
        }
    }
}
`);

sourceFile.saveSync(); // save file to disk so metrics are calculated (this is slower)

const fmxRep = importer.famixRepFromProject(project);

describe('Metrics', () => {

    const jsonOutput = fmxRep.getJSON();
    const parsedModel = JSON.parse(jsonOutput);

    it("should calculate cyclomatic complexity", () => {
        let theMethod = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Method" && el.name === "methodCyclomaticOne"))[0];
        expect(theMethod).toBeTruthy();
        expect(theMethod.cyclomaticComplexity).toBe(1);
        theMethod = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Method" && el.name === "methodCyclomaticFour"))[0];
        expect(theMethod).toBeTruthy();
        expect(theMethod.cyclomaticComplexity).toBe(4);

        let theFunction = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Function" && el.name === "functionCyclomaticOne"))[0];
        expect(theFunction).toBeTruthy();
        expect(theFunction.cyclomaticComplexity).toBe(1);
        theFunction = parsedModel.filter(el => (el.FM3 === "FamixTypeScript.Function" && el.name === "functionCyclomaticFour"))[0];
        expect(theFunction).toBeTruthy();
        expect(theFunction.cyclomaticComplexity).toBe(4);
    });
});
