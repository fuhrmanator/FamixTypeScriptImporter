# VSCode Extension for ts2famix

## Structure

```
ts2famix
└──vscode-extension
    ├── client
    │   ├── src
    │   │   └── extension.ts // Client entry point
    ├── package.json // The extension manifest.
    └── server
        └── src
            └── server.ts // Server entry point
```

## Running the Extension

### Building the ts2famix library
- Run `npm install` in the `ts2famix` folder
- Run `npm run build` in the `ts2famix` folder to build the project
### Building the vscode-extension
- Run `npm install` in the `vscode-extension` folder. This installs all necessary npm modules in both the client and server folder
- Open VS Code on the `vscode-extension` folder. It should be open as a workspace (root directory).
- Press Ctrl+Shift+B to start compiling the client and server in [watch mode](https://code.visualstudio.com/docs/editor/tasks#:~:text=The%20first%20entry%20executes,the%20HelloWorld.js%20file.).
- Switch to the Run and Debug View in the Sidebar (Ctrl+Shift+D).
- Select `Launch Client` from the drop down (if it is not already).
- Press ▷ to run the launch config (F5).
### Manual testing of the extension
- In the [Extension Development Host](https://code.visualstudio.com/api/get-started/your-first-extension#:~:text=Then%2C%20inside%20the%20editor%2C%20press%20F5.%20This%20will%20compile%20and%20run%20the%20extension%20in%20a%20new%20Extension%20Development%20Host%20window.) instance of VSCode, open a typescript project folder that contains a valid `tsconfig.json` file
- Add the output model path
  - Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (macOS) - this should open the **Command Palette**.
  - Start writing and select the `Preferences: Open Settings (UI)` option. This will open User settings.
  - Toggle the `Extension` section. Scroll down, search and select `Ts2Famix`.
  - For the `Famix model output file path` add the output file location where you want your JSON model to be stored. For example, '*C:\Users\User\JSONModels\app.json*'
- Open any file from this folder that has the `.ts` file extension
- Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (macOS) - this should open the **Command Palette**.
- Start writing `ts2famix` and select the `ts2famix: Generate Famix Model` option. This will trigger the command
- Verify that a file in the specified location was generated

## Testing the Extension
### Run Tests
To test the extension run the `npm run test` inside the `vscode-extension` folder. This will run all the tests for the client and server.

### Debug Tests
- Switch to the Run and Debug View in the Sidebar (Ctrl+Shift+D).
- Select `Integration Tests` or `Smoke Tests` from the drop down (if it is not already).
- Press ▷ to run the launch config (F5).