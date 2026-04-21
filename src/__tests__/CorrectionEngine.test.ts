import { describe, it, expect } from 'vitest';
import { CorrectionEngine } from '../CorrectionEngine.js';
import { CorpusTokenizer } from '../CorpusTokenizer.js';
import { CandidateFilter } from '../CandidateFilter.js';
import { WeightedDistanceCalculator, WeightConfig } from '../WeightedDistanceCalculator.js';

describe('CorrectionEngine', () => {
  const tokenizer = new CorpusTokenizer();
  const filter = new CandidateFilter();
  const calculator = new WeightedDistanceCalculator();
  
  const weights: WeightConfig = {
    insertion: 1.0,
    deletion: 1.0,
    substitution: 1.0,
    caseMismatch: 0.1,
    transposition: 0.5
  };

  const engine = new CorrectionEngine(tokenizer, filter, calculator);
  const target = 'GitHub';
  const threshold = 0.5; // Allow case mismatches (0.1 each) and transpositions (0.5) but not substitutions (1.0)

  it('should correct "Github" to "GitHub" in prose', () => {
    // Arrange
    const input = 'Welcome to Github! Checkout github for more.';
    const expected = 'Welcome to GitHub! Checkout GitHub for more.';

    // Act
    const result = engine.processCorpus(input, target, threshold, weights);

    // Assert
    expect(result).toBe(expected);
  });

  it('should not correct words exceeding the distance threshold', () => {
    // Arrange
    const input = 'This is a Githu project.'; // missing 'b' -> distance 1.0 (deletion)
    
    // Act
    const result = engine.processCorpus(input, target, threshold, weights);

    // Assert
    expect(result).toBe(input);
  });

  it('should be idempotent', () => {
    // Arrange
    const input = 'Correcting Github once.';
    
    // Act
    const firstPass = engine.processCorpus(input, target, threshold, weights);
    const secondPass = engine.processCorpus(firstPass, target, threshold, weights);

    // Assert
    expect(firstPass).toBe('Correcting GitHub once.');
    expect(secondPass).toBe(firstPass);
  });

  it('should handle complex punctuation and spacing', () => {
    // Arrange
    const input = '  "github", (Github), [GITHUB]!  ';
    const expected = '  "GitHub", (GitHub), [GitHub]!  ';

    // Act
    const result = engine.processCorpus(input, target, threshold, weights);

    // Assert
    expect(result).toBe(expected);
  });

  it('should return empty string for empty input', () => {
    expect(engine.processCorpus('', target, threshold, weights)).toBe('');
  });
});
