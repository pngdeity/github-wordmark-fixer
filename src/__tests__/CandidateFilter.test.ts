import { describe, it, expect } from 'vitest';
import { CandidateFilter } from '../CandidateFilter.js';

describe('CandidateFilter', () => {
  const filter = new CandidateFilter();
  const target = 'GitHub';

  it('should return true for case-insensitive matches', () => {
    // Arrange & Act & Assert
    expect(filter.isCandidate('github', target)).toBe(true);
    expect(filter.isCandidate('GITHUB', target)).toBe(true);
    expect(filter.isCandidate('Github', target)).toBe(true);
    expect(filter.isCandidate('gitHub', target)).toBe(true);
  });

  it('should return true for typos that contain git or hub within length range', () => {
    expect(filter.isCandidate('githubs', target)).toBe(true);
    expect(filter.isCandidate('githrub', target)).toBe(true);
    expect(filter.isCandidate('gitehub', target)).toBe(true);
  });

  it('should return false for completely different words', () => {
    expect(filter.isCandidate('microsoft', target)).toBe(false);
    expect(filter.isCandidate('google', target)).toBe(false);
  });

  it('should return false for words with extreme length difference', () => {
    expect(filter.isCandidate('g', target)).toBe(false);
    expect(filter.isCandidate('github-wordmark-fixer-is-a-long-string', target)).toBe(false);
  });

  it('should return false for "GitHub" (already correct)', () => {
    // Optimization: if it's already correct, we don't need to "correct" it.
    // However, the calculator would return 0 anyway.
    // But usually, filtering identifies "errors" to be processed.
    // Let's decide: should isCandidate return true for 'GitHub'?
    // If it returns false, we skip the expensive calc.
    expect(filter.isCandidate('GitHub', target)).toBe(false);
  });
});
