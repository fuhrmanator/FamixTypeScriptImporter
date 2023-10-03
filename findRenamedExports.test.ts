import { createProject, doIt } from './findRenamedExports';

describe('doIt', () => {
  it('should return an array of renamed exports', () => {
    const result = doIt(createProject());
    expect(result[0].name).toEqual('foo');
    expect(result[0].type).toEqual('variable');
    expect(result[0].sourceFile.getBaseName()).toEqual('namedExports.ts');
    expect(result[0].aliases.length).toBe(3);
    expect(result[0].aliases[0].sourceFile.getBaseName()).toEqual('reexportNamedExport.ts');
    expect(result[0].aliases[0].alias).toEqual('exportRenamedFoo');
    expect(result[0].aliases[0].renamedOn).toEqual('export');
    expect(result[0].aliases[1].sourceFile.getBaseName()).toEqual('importRenamed.ts');
    expect(result[0].aliases[1].alias).toEqual('importRenamedFoo');
    expect(result[0].aliases[1].renamedOn).toEqual('import');
    expect(result[0].aliases[2].sourceFile.getBaseName()).toEqual('importRenamedNamedExport.ts');
    expect(result[0].aliases[2].alias).toEqual('importRenamedFoo');
    expect(result[0].aliases[2].renamedOn).toEqual('import');
  });
});

