const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const tsConfigPath = path.join(repoRoot, 'tsconfig.json');
const outputPath = path.join(repoRoot, '.github', 'tsmorph-counts.json');

const project = new Project({
  tsConfigFilePath: tsConfigPath
});

const sourceFiles = project
  .getSourceFiles()
  .filter(file => file.getFilePath().endsWith('.ts'));

const counts = {
  modules: 0,
  classes: 0,
  interfaces: 0,
  methods: 0,
  functions: 0,
  accesses: 0,
  invocations: 0,
  inheritances: 0,
  concretisations: 0,
  imports: 0,
  exports: 0
};

for (const sourceFile of sourceFiles) {
  counts.modules++;
  counts.imports += sourceFile.getImportDeclarations().length;
  counts.exports += sourceFile.getExportDeclarations().length;

  sourceFile.forEachDescendant(node => {
    switch (node.getKind()) {
      case SyntaxKind.ClassDeclaration: {
        counts.classes++;
        const cls = node.asKindOrThrow(SyntaxKind.ClassDeclaration);
        if (cls.getExtends()) {
          counts.inheritances++;
        }
        counts.concretisations += cls.getImplements().length;
        break;
      }
      case SyntaxKind.InterfaceDeclaration:
        counts.interfaces++;
        break;
      case SyntaxKind.MethodDeclaration:
        counts.methods++;
        break;
      case SyntaxKind.FunctionDeclaration:
        counts.functions++;
        break;
      case SyntaxKind.CallExpression:
        counts.invocations++;
        break;
      case SyntaxKind.PropertyAccessExpression:
        counts.accesses++;
        break;
    }
  });
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(counts, null, 2));

console.log('ts-morph entity counts exported:');
console.log(counts);
