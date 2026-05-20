# ts2famix VSCode Extension

Real-time TypeScript model generation for FAMIX/Moose analysis. This extension automatically creates and updates FAMIX models of your TypeScript code as you make changes, eliminating manual model generation steps.

## Features

- **Automatic model generation** — generates a FAMIX JSON model from your TypeScript project
- **Real-time updates** — the model is automatically updated on every file save (`Cmd+S` / `Ctrl+S`)
- **Famix Model panel** — a visual tree view in the Explorer sidebar showing all classes, methods and properties in real time

## Installation

Search for `ts2famix` in the VSCode Marketplace and click **Install**.

## Usage

1. Open a TypeScript project folder that contains a valid `tsconfig.json`
2. Configure the output path: `Cmd+Shift+P` → `Preferences: Open Settings (UI)` → search `Ts2Famix` → set **Famix Model Output File Path** (e.g. `/path/to/project/model.json`)
3. Generate the model: `Cmd+Shift+P` → `ts2famix: Generate Famix Model`
4. The model updates automatically on every `Cmd+S`
5. View the model structure in the **Famix Model** panel in the Explorer sidebar

## Development

### Requirements
- Node.js >= 18
- VSCode >= 1.94

### Setup
```bash
git clone https://github.com/Leoo-code/FamixTypeScriptImporter.git
cd FamixTypeScriptImporter
git checkout dev
bash vscode-extension/install.sh
```

## Useful Links

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [TypeScript support for Moose](https://fuhrmanator.github.io/posts/typescript-in-moose/)