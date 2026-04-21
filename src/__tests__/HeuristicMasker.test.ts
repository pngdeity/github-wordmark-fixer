import { describe, it, expect } from 'vitest';
import { HeuristicMasker, MaskedRegion } from '../HeuristicMasker.js';
import { ProseNode } from '../types.js';

describe('HeuristicMasker', () => {
  const masker = new HeuristicMasker();

  it('should mask URLs', () => {
    const node: ProseNode = {
      filePath: 'test.ts',
      rawText: 'Check out https://github.com/pngdeity',
      globalStartIndex: 0,
      globalEndIndex: 37,
      maskedRegions: []
    };

    const result = masker.mask(node);
    
    expect(result.maskedRegions).toHaveLength(1);
    expect(result.maskedRegions[0]).toEqual({
      localStartIndex: 10,
      localEndIndex: 37,
      reason: 'URL'
    });
  });

  it('should mask markdown code blocks', () => {
    const node: ProseNode = {
      filePath: 'test.md',
      rawText: 'Here is some `github` code.',
      globalStartIndex: 0,
      globalEndIndex: 27,
      maskedRegions: []
    };

    const result = masker.mask(node);
    
    expect(result.maskedRegions).toHaveLength(1);
    expect(result.maskedRegions[0]).toEqual({
      localStartIndex: 13,
      localEndIndex: 21,
      reason: 'MarkdownCode'
    });
  });

  it('should mask email addresses', () => {
    const node: ProseNode = {
      filePath: 'test.txt',
      rawText: 'Contact nathan@github.com',
      globalStartIndex: 0,
      globalEndIndex: 25,
      maskedRegions: []
    };

    const result = masker.mask(node);
    
    expect(result.maskedRegions).toHaveLength(1);
    expect(result.maskedRegions[0]).toEqual({
      localStartIndex: 8,
      localEndIndex: 25,
      reason: 'Email'
    });
  });

  it('should not mask regular prose', () => {
    const node: ProseNode = {
      filePath: 'test.ts',
      rawText: 'This is a Github project.',
      globalStartIndex: 0,
      globalEndIndex: 25,
      maskedRegions: []
    };

    const result = masker.mask(node);
    expect(result.maskedRegions).toHaveLength(0);
  });
});
