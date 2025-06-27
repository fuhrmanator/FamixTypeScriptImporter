import * as vscode from 'vscode';
import * as assert from 'assert';
import * as path from 'path';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import proxyquire from 'proxyquire';

describe('Utils', () => {
  describe('getBaseUrl', () => {
    let sandbox: sinon.SinonSandbox;
    let mockDocument: vscode.TextDocument;
    let mockWorkspaceFolder: vscode.WorkspaceFolder;
    let fsStub: { 
      existsSync: sinon.SinonStub;
      readFileSync: sinon.SinonStub;
    };
    let vsCodeStub: { 
      workspace: { 
        getWorkspaceFolder: sinon.SinonStub 
      } 
    };
    let utilsModule: { 
      getBaseUrl: (document: vscode.TextDocument) => string | undefined 
    };
    
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      
      mockDocument = {
        uri: { fsPath: '/path/to/file.ts' } as vscode.Uri
      } as vscode.TextDocument;
      
      mockWorkspaceFolder = {
        uri: { fsPath: '/path/to' } as vscode.Uri,
        name: 'test',
        index: 0
      };
      
      fsStub = {
        existsSync: sandbox.stub(),
        readFileSync: sandbox.stub()
      };
      
      vsCodeStub = {
        workspace: {
          getWorkspaceFolder: sandbox.stub()
        }
      };
      
      utilsModule = proxyquire('../../../utils', {
        'fs': fsStub,
        'vscode': vsCodeStub
      });
    });
    
    afterEach(() => {
      sandbox.restore();
    });
    
    it('should return undefined when no workspace folder is found', () => {
      // Setup
      vsCodeStub.workspace.getWorkspaceFolder.returns(undefined);
      
      // Execute
      const result = utilsModule.getBaseUrl(mockDocument);
      
      // Verify
      assert.strictEqual(result, undefined);
      sinon.assert.calledOnce(vsCodeStub.workspace.getWorkspaceFolder);
      sinon.assert.calledWith(vsCodeStub.workspace.getWorkspaceFolder, mockDocument.uri);
    });
    
    it('should return workspace folder path when tsconfig.json does not exist', () => {
      // Setup
      vsCodeStub.workspace.getWorkspaceFolder.returns(mockWorkspaceFolder);
      fsStub.existsSync.returns(false);
      
      // Execute
      const result = utilsModule.getBaseUrl(mockDocument);
      
      // Verify
      assert.strictEqual(result, undefined);
      sinon.assert.calledOnce(vsCodeStub.workspace.getWorkspaceFolder);
      sinon.assert.calledOnce(fsStub.existsSync);
      sinon.assert.calledWith(fsStub.existsSync, path.join('/path/to', 'tsconfig.json'));
    });
    
    it('should return baseUrl from tsconfig.json when it exists', () => {
      // Setup
      vsCodeStub.workspace.getWorkspaceFolder.returns(mockWorkspaceFolder);
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify({
        compilerOptions: {
          baseUrl: './src'
        }
      }));
      
      // Execute
      const result = utilsModule.getBaseUrl(mockDocument);
      
      // Verify
      assert.strictEqual(result, path.resolve('/path/to', './src'));
      sinon.assert.calledOnce(vsCodeStub.workspace.getWorkspaceFolder);
      sinon.assert.calledOnce(fsStub.existsSync);
      sinon.assert.calledOnce(fsStub.readFileSync);
    });
    
    it('should return workspace folder path when tsconfig.json exists but has no baseUrl', () => {
      // Setup
      vsCodeStub.workspace.getWorkspaceFolder.returns(mockWorkspaceFolder);
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify({
        compilerOptions: {}
      }));
      
      // Execute
      const result = utilsModule.getBaseUrl(mockDocument);
      
      // Verify
      assert.strictEqual(result, '/path/to');
      sinon.assert.calledOnce(vsCodeStub.workspace.getWorkspaceFolder);
      sinon.assert.calledOnce(fsStub.existsSync);
      sinon.assert.calledOnce(fsStub.readFileSync);
    });
    
    it('should handle JSON parsing errors gracefully', () => {
      // Setup
      vsCodeStub.workspace.getWorkspaceFolder.returns(mockWorkspaceFolder);
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.throws(new Error('Invalid JSON'));
      
      // Execute & Verify
      assert.throws(() => {
        utilsModule.getBaseUrl(mockDocument);
      });
    });
  });
});
