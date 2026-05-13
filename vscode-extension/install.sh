#!/bin/bash

echo "Installing ts2famix VSCode Extension..."

# Check if code command is available
if ! command -v code &> /dev/null; then
    echo "ERROR: 'code' command not found."
    echo "Please add VSCode to your PATH first:"
    echo "  - Mac/Linux: Open VSCode, press Cmd+Shift+P, type 'Shell Command: Install code command in PATH'"
    echo "  - Windows: VSCode adds 'code' to PATH automatically during installation"
    exit 1
fi

# Step 1 - Install and build ts2famix
echo "Building ts2famix..."
npm install
npx tsc

# Step 2 - Install extension dependencies
echo "Installing extension dependencies..."
cd vscode-extension
npm install

# Step 3 - Package the extension
echo "Packaging extension..."
npx @vscode/vsce package --allow-missing-repository

# Step 4 - Install in VSCode
echo "Installing extension in VSCode..."
code --install-extension ts2famix-vscode-extension-0.0.1.vsix

echo "Done! Restart VSCode and open a TypeScript project to use the extension."
