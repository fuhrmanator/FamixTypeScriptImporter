/*
Portions of this file:

MIT License

Copyright (c) 2018 Anand Undavia

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { forEachChild, SyntaxKind, createSourceFile } from 'typescript';
import { isFunctionWithBody } from 'tsutils';
import { existsSync, readFileSync } from 'fs';

const { isIdentifier } = require('typescript');

const getNodeName = (node) => {
  const { name, pos, end } = node;
  const key = name !== undefined && isIdentifier(name) ? name.text : JSON.stringify({ pos, end });
  return key;
};

const increasesComplexity = (node) => {
  /* eslint-disable indent */
  switch (node.kind) {
    case SyntaxKind.CaseClause:
      return node.statements.length > 0;
    case SyntaxKind.CatchClause:
    case SyntaxKind.ConditionalExpression:
    case SyntaxKind.DoStatement:
    case SyntaxKind.ForStatement:
    case SyntaxKind.ForInStatement:
    case SyntaxKind.ForOfStatement:
    case SyntaxKind.IfStatement:
    case SyntaxKind.WhileStatement:
      return true;

    case SyntaxKind.BinaryExpression:
      switch (node.operatorToken.kind) {
        case SyntaxKind.BarBarToken:
        case SyntaxKind.AmpersandAmpersandToken:
          return true;
        default:
          return false;
      }

    default:
      return false;
  }
  /* eslint-enable indent */
};

const calculateFromSource = (ctx) => {
  let complexity = 0;
  const output = {};
  forEachChild(ctx, function cb(node) {
    if (isFunctionWithBody(node)) {
      const old = complexity;
      complexity = 1;
      forEachChild(node, cb);
      const name = getNodeName(node)?.toString();
      output[name] = complexity;
      complexity = old;
    } else {
      if (increasesComplexity(node)) {
        complexity += 1;
      }
      forEachChild(node, cb);
    }
  });
  return output;
};

var i = 0;
export const calculate = (filePath) => {
  if (i == 0){
    console.log(filePath)
    i = i+1
  }
  console.log("nour")
  if (!existsSync(filePath)) {
    throw new Error(`File "${filePath}" does not exists`);
  }
  const sourceText = readFileSync(filePath).toString();
  const source = createSourceFile(filePath, sourceText, isIdentifier.ES2015);
  return calculateFromSource(source);
};
