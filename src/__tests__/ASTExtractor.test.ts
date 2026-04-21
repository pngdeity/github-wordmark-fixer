import { describe, it, expect } from 'vitest';
import { ASTExtractor } from '../ASTExtractor.js';
import { ProseNode } from '../types.js';

describe('ASTExtractor', () => {
  const extractor = new ASTExtractor();

  it('should extract comments from TypeScript code', () => {
    const code = `
      // This is a test comment about github
      const x = 1;
      /* Another github comment */
      const y = "test";
    `;

    const nodes = extractor.extract(code, 'test.ts');
    
    expect(nodes).toHaveLength(2);
    expect(nodes[0].rawText).toBe('// This is a test comment about github');
    expect(nodes[1].rawText).toBe('/* Another github comment */');
    
    // Check start and end indices
    expect(code.substring(nodes[0].globalStartIndex, nodes[0].globalEndIndex)).toBe(nodes[0].rawText);
  });

  it('should handle code without comments', () => {
    const code = `const x = 1; const y = 2;`;
    const nodes = extractor.extract(code, 'test.ts');
    expect(nodes).toHaveLength(0);
  });
});
