import { CorpusTokenizer, Token } from './CorpusTokenizer.js';
import { CandidateFilter } from './CandidateFilter.js';
import { WeightedDistanceCalculator, WeightConfig } from './WeightedDistanceCalculator.js';

export class CorrectionEngine {
  constructor(
    public readonly tokenizer: CorpusTokenizer,
    public readonly filter: CandidateFilter,
    public readonly calculator: WeightedDistanceCalculator
  ) {}

  /**
   * Processes a raw text corpus and corrects misspellings of the target wordmark.
   * 
   * @param rawText The input text to process.
   * @param target The correct wordmark (e.g., "GitHub").
   * @param threshold The maximum allowed distance for a correction.
   * @param weights The weight configuration for distance calculation.
   * @returns The corrected text.
   */
  processCorpus(
    rawText: string,
    target: string,
    threshold: number,
    weights: WeightConfig
  ): string {
    if (!rawText) {
      return '';
    }

    const tokens = this.tokenizer.tokenize(rawText);
    const processedTokens = tokens.map((token) => this.processToken(token, target, threshold, weights));

    return this.tokenizer.reconstruct(processedTokens);
  }

  /**
   * Evaluates a single token and replaces its text if it matches correction criteria.
   * 
   * @param token The token to evaluate.
   * @param target The target wordmark.
   * @param threshold The maximum distance threshold.
   * @param weights The weight configuration.
   * @returns A new token with potentially corrected text.
   */
  private processToken(
    token: Token,
    target: string,
    threshold: number,
    weights: WeightConfig
  ): Token {
    // Only attempt to correct alphanumeric "words" that pass the candidate filter
    if (token.isWord && this.filter.isCandidate(token.text, target)) {
      const distance = this.calculator.calculateDistance(token.text, target, weights);
      
      if (distance <= threshold) {
        return { ...token, text: target };
      }
    }

    // Return original token (immutability preserved)
    return token;
  }
}
