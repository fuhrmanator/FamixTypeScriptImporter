# Manual E2E Test Cases for ts2famix VS Code Extension

## Prerequisites
- VS Code with the extension installed or running in Extension Development Host

✅ - tested  
🕔 - test later, lower priority  
🐤 - does not pass

## Extension Activation Tests

### ✅ TC001: Extension Activation on Workspace open
**Scenario**: Extension activates when opening a workspace with tsconfig.json file in the root
- Start VS Code with no extensions activated
- Open a folder containing tsconfig.json file in the root
- **Expected**: Extension activates automatically, language server starts

### ✅ TC001-1: Extension Activation on Workspace open
**Scenario**: Extension activates when opening a workspace WITHOUT tsconfig.json file in the root
- Start VS Code with no extensions activated
- Open a folder containing WITHOUT tsconfig.json file in the root
- **Expected**: Extension does not activate

### ✅ TC002: Extension Activation on Command Execution
**Scenario**: Extension activates when command is executed
- Start VS Code with no extensions activated
- Open any project with/without tsconfig.json
- Execute `ts2famix: Generate Famix Model` command via Command Palette
- **Expected**: Extension activates

### 🕔 TC003: Multiple Workspace Activation
**Scenario**: Extension activation across multiple workspaces
- Open multi-root workspace with TypeScript and non-TypeScript projects
- Open TypeScript file in first workspace
- Open file in second workspace
- **Expected**: Extension activates per workspace, proper isolation

### 🕔 TC004: Extension Deactivation and Reactivation
**Scenario**: Extension lifecycle management
- Activate extension
- Disable/re-enable extension
- Activate again
- **Expected**: Proper deactivation and reactivation cycles

## Execution of the `ts2famix.generateModelForProject` Command

### ✅ TC005: Command Execution When No Workspace is Open
**Scenario**: Command triggered when no workspace is open
- Start VS Code with no extensions activated
- Execute `ts2famix: Generate Famix Model` command via Command Palette
- **Expected**: Error message is shown

### ✅ TC006: Command Execution Without tsconfig.json
**Scenario**: TypeScript files without configuration
- Folder with `.ts` files but no `tsconfig.json`
- Attempt model generation
- **Expected**: Show appropriate error

### ✅ TC007: Invalid tsconfig.json: Command Execution
**Scenario**: Project with malformed configuration
- Create project with syntactically invalid `tsconfig.json`
- Attempt model generation
- **Expected**: Show the error

### ✅ TC008: Change Invalid tsconfig.json to Valid: Command Execution
**Scenario**: Project with malformed configuration
- Create project with syntactically invalid `tsconfig.json`
- Attempt model generation
- **Expected**: Generate model after tsconfig.json became valid

### 🕔 TC009: Invalid tsconfig.json: Incremental Update
**Scenario**: Project with malformed configuration
- Create project with syntactically invalid `tsconfig.json`
- Attempt model generation
- **Expected**: Show the error

### 🕔 TC010: Change Invalid tsconfig.json to Valid: Incremental Update
**Scenario**: Project with malformed configuration
- Create project with syntactically invalid `tsconfig.json`
- Attempt model generation
- **Expected**: Generate model after tsconfig.json became valid

## Configuration Tests

### ✅ TC011: Model Generation Without Output Path: Command Execution
**Scenario**: Attempt model generation without configured output path
- Open TypeScript project
- Clear/don't set output path in settings
- Execute generate command
- **Expected**: Error message about missing output path

### ✅ TC012: Model Generation Without Output Path: Incremental Update
**Scenario**: Attempt model generation without configured output path
- Open TypeScript project
- Clear/don't set output path in settings
- Execute generate command
- **Expected**: Error message about missing output path

### ✅ TC013: Valid Output Path
**Scenario**: Configure valid file system path
- Set output path to existing directory with write permissions
- Generate model
- **Expected**: File created successfully

### ❓🕔 TC014: Invalid Output Path
**Scenario**: Configure non-existent or invalid path
- Set output path to non-existent directory or invalid location
- Generate model
- **Expected**: ??? Should return the error or create the path
- **Actual**: Creates the model in the relative path

### 🕔 TC015: Read-Only Output Location
**Scenario**: Configure path without write permissions
- Set output path to read-only directory
- Generate model
- **Expected**: Permission error handling

### ✅ TC016: Relative vs Absolute Paths
**Scenario**: Test different path formats
- Test with: 
	- relative paths, 
	- absolute paths, 
- Generate models
- **Expected**: Proper path resolution

## Language Server Tests

### 🕔 TC017: Server Restart
**Scenario**: Server recovery after issues
- Force server disconnect/restart
- Execute commands after restart
- **Expected**: Commands work after server recovery

## File System Tests

### ✅ TC018: Special Characters in Paths
**Scenario**: Projects with non-ASCII characters
- Project paths containing:
	- spaces, 
	- unicode, 
	- special characters
- Generate model
- **Expected**: Handles special characters correctly

### ✅ TC019: Output File Overwrite
**Scenario**: Overwriting existing model files
- Generate model to existing file location
- Generate again to same location
- **Expected**: File overwritten successfully

## Error Handling Tests

### 🕔 TC020: File Access Errors
**Scenario**: Files being modified during generation
- Start generation while files are being edited/saved
- **Expected**: Handles file access conflicts

## VS Code Extension tests

### ❓🕔 TC021: Multi-Workspace Support
**Scenario**: Multiple workspace folders
- Open VS Code with multiple workspace folders
- Generate models from different workspaces
- **Expected**: Correct workspace isolation

## Incremental Functionality Tests

### ✅ TC022: File Content Modification
**Scenario**: Update existing TypeScript file content
- Generate initial model for project
- Modify class/interface/function in existing `.ts` file
- Save file
- **Expected**: Model updated incrementally without full regeneration

### ✅ TC023: New `.ts` File Creation
**Scenario**: Add new TypeScript file to project
- Generate initial model
- Create new `.ts` file in project directory
- Add TypeScript code to new file
- **Expected**: New file elements added to existing model

### ✅ TC024: New NON-`.ts` File Creation
**Scenario**: Add new TypeScript file to project
- Generate initial model
- Create new `.txt` file in project directory
- Add some text to new file
- **Expected**: Model is unchanged

### ✅ TC025: Typescript File Deletion
**Scenario**: Remove TypeScript file from project
- Generate initial model with multiple files
- Delete one `.ts` file from project
- **Expected**: Deleted file elements removed from model

### ✅ TC026: NON-Typescript File Deletion
**Scenario**: Remove NON-TypeScript file from project
- Generate initial model with multiple files
- Delete one `.txt` file from project
- **Expected**: Model is unchanged

### ✅ TC027: Typescript File Rename/Move
**Scenario**: Rename or move TypeScript files
- Generate initial model
- Rename `.ts` file or move to different directory
- **Expected**: Model reflects file path changes correctly

### ✅ TC028: Typescript to txt File Rename
**Scenario**: Rename TypeScript files
- Generate initial model
- Rename `.ts` file to  `.txt`
- **Expected**: Model reflects file path changes correctly

### ✅ TC029: txt to ts File Rename
**Scenario**: Rename txt files
- Generate initial model
- Rename `.txt` file to  `.ts`
- **Expected**: Model reflects file path changes correctly

### 🐤 TC030: ts -> txt -> ts File Rename
**Scenario**: Rename txt files
- Generate initial model
- Rename `.ts` -> `.txt` -> `.ts`
- **Expected**: Model reflects file path changes correctly
- !!!: Need to adjust the fmxFileMap in order to fix it

### ✅ TC031: Multiple Simultaneous Changes
**Scenario**: Batch file operations
- Generate initial model
- Disable auto-save
- Perform multiple operations: create, modify, delete files simultaneously (may need to set up saving all the files in the shortcuts)
- **Expected**: All changes processed correctly in batch
	- ✅ modify 2 independent files
	- ✅ modify 1 file, add 1 file - (do not occur simultaneously)
	- ✅ modify 1 file, delete 1 file - (do not occur simultaneously)

### ✅ TC032: Rapid Sequential Changes
**Scenario**: Quick succession of file modifications in VS Code
- Generate initial model
- Type rapidly in editor without saving (auto-save disabled)
- Enable auto-save and observe change detection
- Use Ctrl+S repeatedly while typing
- Use Ctrl+Z/Ctrl+Y (undo/redo) rapidly
- **Expected**: Changes processed efficiently

### ✅ TC033: VS Code Auto-Save Integration
**Scenario**: Auto-save functionality interaction
- Configure different auto-save settings (off, afterDelay, onFocusChange)
- Make changes with each auto-save mode
- Switch between files rapidly
- **Expected**: Model updates respect auto-save behavior

### ❓✅ TC034: VS Code Copilot
**Scenario**: Change multiple files with Copilot
- Generate initial model
- Use Copilot to change the occurrences in the multiple files
- **Expected**: ???
- **Actual**: It updates the model even when the changes from the Copilot were not accepted

### ✅ TC035: VS Code Refactoring Operations
**Scenario**: Built-in refactoring tools
- Generate initial model
- ✅ Use "Move to file" refactoring
- ✅ Use "Move to new file" refactoring
- **Expected**: Refactoring operations trigger correct incremental updates

### ✅ TC036: VS Code Git Integration
**Scenario**: Git operations within VS Code
- Generate initial model
- ✅ Stash/Unstash changes
- ✅ Switch branches
- **Expected**: Git operations handled gracefully, model stays consistent

### 🕔 TC037: VS Code Extensions Interaction
**Scenario**: Other extension interference
- Install Prettier extension, format code automatically
- Use GitLens extension features
- Install TypeScript Hero or similar extensions
- Use snippets extensions that modify code
- **Expected**: Other extensions don't interfere with model generation

### ✅ TC038: VS Code Search and Replace
**Scenario**: Global search and replace operations
- Generate initial model
- Use Ctrl+Shift+F for workspace-wide search
- Perform global replace operations
- **Expected**: Global replacements trigger appropriate model updates

### 🕔 TC039: VS Code File Recovery
**Scenario**: VS Code crash and recovery scenarios
- Make unsaved changes, simulate VS Code crash
- Test hot exit functionality
- Recover from backup files
- Handle corrupted workspace state
- **Expected**: Extension recovers gracefully after VS Code restart

### 🕔 TC040: VS Code Workspace Trust
**Scenario**: Restricted mode and workspace trust
- Open project in Restricted Mode
- Grant workspace trust
- Test extension functionality before/after trust
- **Expected**: Extension respects workspace trust settings
