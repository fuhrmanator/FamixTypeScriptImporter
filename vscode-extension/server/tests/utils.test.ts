import { getOutputFilePath } from '../src/utils';
import { Connection } from 'vscode-languageserver/node';

jest.mock('vscode-languageserver/node', () => ({
  createConnection: jest.fn(),
}));

describe('Utils', () => {
  describe('getOutputFilePath', () => {
    it('should return the configured output file path', async () => {
		const  jsonFilePath = '/path/to/output.json';
		const mockConnection = {
			workspace: {
			getConfiguration: jest.fn().mockResolvedValue({
				FamixModelOutputFilePath: jsonFilePath
			})
			}
		} as unknown as Connection;

		const result = await getOutputFilePath(mockConnection);
		
		expect(mockConnection.workspace.getConfiguration).toHaveBeenCalledWith({ 
			section: 'ts2famix' 
		});
		expect(result).toBe(jsonFilePath);
    });

    it('should return empty string when output file path is not configured', async () => {
      const mockConnection = {
        workspace: {
          getConfiguration: jest.fn().mockResolvedValue({})
        }
      } as unknown as Connection;

      const result = await getOutputFilePath(mockConnection);
      
      expect(result).toBe('');
    });
  });
});
