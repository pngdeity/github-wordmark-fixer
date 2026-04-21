import { describe, it, expect } from 'vitest';
import { WeightedDistanceCalculator, WeightConfig } from '../WeightedDistanceCalculator.js';

describe('WeightedDistanceCalculator', () => {
  const calculator = new WeightedDistanceCalculator();
  const weights: WeightConfig = {
    insertion: 1.0,
    deletion: 1.0,
    substitution: 1.0,
    caseMismatch: 0.1,
    transposition: 0.5
  };

  it('should return 0 for identical strings', () => {
    expect(calculator.calculateDistance('GitHub', 'GitHub', weights)).toBe(0);
  });

  it('should penalize case mismatches with caseMismatch weight', () => {
    // "Github" -> "GitHub" (one case mismatch at 'h' vs 'H')
    expect(calculator.calculateDistance('Github', 'GitHub', weights)).toBeCloseTo(0.1);
    // "github" -> "GitHub" (two case mismatches: 'g' and 'h')
    expect(calculator.calculateDistance('github', 'GitHub', weights)).toBeCloseTo(0.2);
    // "GIThub" -> "GitHub" (four case mismatches: 'I', 'T', 'h' is actually correct case for h? No, 'github' has 'h', 'GitHub' has 'H'. Wait.)
    // G i t H u b
    // G I T h u b
    // Match G
    // i vs I -> case mismatch
    // t vs T -> case mismatch
    // H vs h -> case mismatch
    // u vs u -> match
    // b vs b -> match
    // Total: 0.3
    expect(calculator.calculateDistance('GITHub', 'GitHub', weights)).toBeCloseTo(0.2); // G, H, u, b match. I, T mismatch.
  });

  it('should penalize substitutions with substitution weight', () => {
    // "GitXub" -> "GitHub"
    expect(calculator.calculateDistance('GitXub', 'GitHub', weights)).toBeCloseTo(1.0);
  });

  it('should penalize insertions with insertion weight', () => {
    // "GitHube" -> "GitHub" (deletion in source, or insertion in target)
    expect(calculator.calculateDistance('GitHube', 'GitHub', weights)).toBeCloseTo(1.0);
  });

  it('should penalize deletions with deletion weight', () => {
    // "Gitub" -> "GitHub" (insertion in source, or deletion in target)
    expect(calculator.calculateDistance('Gitub', 'GitHub', weights)).toBeCloseTo(1.0);
  });

  it('should penalize transpositions with transposition weight', () => {
    // "GiHtub" -> "GitHub" (Ht vs tH)
    expect(calculator.calculateDistance('GiHtub', 'GitHub', weights)).toBeCloseTo(0.5);
  });

  it('should handle empty strings', () => {
    expect(calculator.calculateDistance('', 'GitHub', weights)).toBe(6.0); // 6 insertions
    expect(calculator.calculateDistance('GitHub', '', weights)).toBe(6.0); // 6 deletions
    expect(calculator.calculateDistance('', '', weights)).toBe(0);
  });

  it('should prioritize the cheapest operation', () => {
    // "Githu" -> "GitHub" 
    // Option 1: Delete 'u', Insert 'u', 'b' (Too expensive)
    // Option 2: Case mismatch 'h' (0.1) + Insert 'b' (1.0) = 1.1
    expect(calculator.calculateDistance('Githu', 'GitHub', weights)).toBeCloseTo(1.1);
  });

  it('should correctly handle multiple different operations', () => {
    // "gitub" -> "GitHub"
    // g -> G (0.1)
    // i -> i (0.0)
    // t -> t (0.0)
    // (missing H) -> (insert H, 1.0)
    // u -> u (0.0)
    // b -> b (0.0)
    // Total: 1.1
    expect(calculator.calculateDistance('gitub', 'GitHub', weights)).toBeCloseTo(1.1);
  });

  it('should be symmetric for standard Levenshtein weights', () => {
    const symWeights: WeightConfig = {
      insertion: 1.0,
      deletion: 1.0,
      substitution: 1.0,
      caseMismatch: 1.0,
      transposition: 1.0
    };
    const s1 = 'kitten';
    const s2 = 'sitting';
    expect(calculator.calculateDistance(s1, s2, symWeights)).toBe(calculator.calculateDistance(s2, s1, symWeights));
    expect(calculator.calculateDistance(s1, s2, symWeights)).toBe(3); // k->s, e->i, ->g
  });
});
