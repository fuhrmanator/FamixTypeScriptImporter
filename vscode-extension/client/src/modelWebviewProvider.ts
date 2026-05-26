import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ModelWebviewProvider {
    private panel: vscode.WebviewPanel | undefined;

    public show(modelPath: string, context: vscode.ExtensionContext) {
        if (this.panel) {
            this.panel.reveal();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'ts2famixModel',
                'Famix Model Viewer',
                vscode.ViewColumn.Two,
                { enableScripts: true }
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }

        this.panel.webview.html = this.getWebviewContent(modelPath);
    }

    private getWebviewContent(modelPath: string): string {
        if (!fs.existsSync(modelPath)) {
            return `<html><body><h2>No model.json found. Generate the model first.</h2></body></html>`;
        }

        const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
        const mermaidDiagram = this.buildMermaidDiagram(modelData);

        return `<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body { background: #1e1e1e; color: white; font-family: sans-serif; padding: 20px; }
        h2 { color: #4ec9b0; }
        .mermaid { background: #252526; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <h2>Famix Model — Class Diagram</h2>
    <div class="mermaid">
${mermaidDiagram}
    </div>
    <script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
</body>
</html>`;
    }

    private buildMermaidDiagram(modelData: any[]): string {
        const classes = modelData.filter(e => e.FM3 === 'FamixTypeScript.Class' || e.FM3 === 'FamixTypeScript.Interface');
        const inheritances = modelData.filter(e => e.FM3 === 'FamixTypeScript.Inheritance');

        const classMap = new Map<number, string>();
        classes.forEach(c => classMap.set(c.id, c.name));

        let diagram = 'classDiagram\n';

        classes.forEach(c => {
            diagram += `    class ${c.name} {\n`;
            if (c.attributes) {
                c.attributes.forEach((attr: any) => {
                    const attrEntity = modelData.find(e => e.id === attr.ref);
                    if (attrEntity) diagram += `        +${attrEntity.name}\n`;
                });
            }
            if (c.methods) {
                c.methods.forEach((method: any) => {
                    const methodEntity = modelData.find(e => e.id === method.ref);
                    if (methodEntity) diagram += `        +${methodEntity.name}()\n`;
                });
            }
            diagram += `    }\n`;
        });

        inheritances.forEach(inh => {
            const superClass = classMap.get(inh.superclass?.ref);
            const subClass = classMap.get(inh.subclass?.ref);
            if (superClass && subClass) {
                diagram += `    ${superClass} <|-- ${subClass}\n`;
            }
        });

        return diagram;
    }
}