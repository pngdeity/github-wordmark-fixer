import { describe, it, expect } from 'vitest';
import { FilePatcher } from '../FilePatcher.js';
import { MutationProposal } from '../types.js';

describe('FilePatcher', () => {
  const patcher = new FilePatcher();

  it('should apply a single mutation', () => {
    const rawCode = `const x = 1; // Hello Github`;
    const mutations: MutationProposal[] = [
      {
        filePath: 'test.ts',
        globalStartIndex: 22,
        removalLength: 6,
        replacementString: 'GitHub'
      }
    ];

    const result = patcher.patch(rawCode, mutations);
    expect(result).toBe(`const x = 1; // Hello GitHub`);
  });

  it('should apply multiple mutations in reverse order', () => {
    const rawCode = `// github first\nconst x = "github second";`;
    const mutations: MutationProposal[] = [
      {
        filePath: 'test.ts',
        globalStartIndex: 3,
        removalLength: 6,
        replacementString: 'GitHub'
      },
      {
        filePath: 'test.ts',
        globalStartIndex: 27,
        removalLength: 6,
        replacementString: 'GitHub'
      }
    ];

    // Note: patcher should sort them in reverse order internally
    const result = patcher.patch(rawCode, mutations);
    expect(result).toBe(`// GitHub first\nconst x = "GitHub second";`);
  });

  it('should handle no mutations', () => {
    const rawCode = `const x = 1;`;
    const result = patcher.patch(rawCode, []);
    expect(result).toBe(rawCode);
  });
});
