import * as vscode from 'vscode';
import * as fs from 'fs';

interface FamixEntity {
    FM3: string;
    id: number;
    name?: string;
    methods?: Array<{ ref: number }>;
    attributes?: Array<{ ref: number }>;
    signature?: string;
}

export class FamixModelProvider implements vscode.TreeDataProvider<FamixTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<FamixTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private entities: FamixEntity[] = [];

    refresh(modelPath: string): void {
        try {
            const content = fs.readFileSync(modelPath, 'utf-8');
            this.entities = JSON.parse(content);
        } catch {
            this.entities = [];
        }
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FamixTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FamixTreeItem): FamixTreeItem[] {
        if (!element) {
            return this.entities
                .filter(e => e.FM3 === 'FamixTypeScript.Class')
                .map(cls => new FamixTreeItem(
                    cls.name || 'Unknown',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'class',
                    cls.id
                ));
        }
        if (element.type === 'class') {
            const cls = this.entities.find(e => e.id === element.entityId);
            if (!cls) { return []; }
            const items: FamixTreeItem[] = [];
            (cls.methods || []).forEach(m => {
                const method = this.entities.find(e => e.id === m.ref);
                if (method) {
                    items.push(new FamixTreeItem(method.signature || method.name || 'unknown', vscode.TreeItemCollapsibleState.None, 'method', method.id));
                }
            });
            (cls.attributes || []).forEach(a => {
                const attr = this.entities.find(e => e.id === a.ref);
                if (attr) {
                    items.push(new FamixTreeItem(attr.name || 'unknown', vscode.TreeItemCollapsibleState.None, 'property', attr.id));
                }
            });
            return items;
        }
        return [];
    }
}

export class FamixTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'class' | 'method' | 'property',
        public readonly entityId: number
    ) {
        super(label, collapsibleState);
        if (type === 'class') { this.iconPath = new vscode.ThemeIcon('symbol-class'); }
        else if (type === 'method') { this.iconPath = new vscode.ThemeIcon('symbol-method'); this.description = 'method'; }
        else { this.iconPath = new vscode.ThemeIcon('symbol-property'); this.description = 'property'; }
    }
}
