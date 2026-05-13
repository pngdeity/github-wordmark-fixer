# Software Specification: Target-Centric Spelling Normalization Engine (Node.js/TypeScript)

## 1. Executive Summary
**Objective:** Correct misspellings and capitalization errors of "GitHub" using a multi-pass approach.
**Methodology:** Fast-pass filtering followed by a computationally intensive Weighted Levenshtein Distance algorithm.

## 2. Core Functionality
1. **Tokenization:** Split prose into `Token` objects while preserving whitespace and punctuation.
2. **Fast-Pass Filtering:** Discard irrelevant words based on length and a rapid case-insensitive check for "github".
3. **Weighted Distance Calculation:** Use a dynamic programming matrix where the cost of moving between cells is dictated by a `WeightConfig` (penalizing case mismatches differently than substitutions).
4. **Classification & Replacement:** Replace tokens where distance ≤ threshold with "GitHub".
5. **Reconstruction:** Reassemble tokens into the final string.

## 3. Architecture (TypeScript)

### Class: `CorpusTokenizer`
- `tokenize(rawText: string): Token[]`
- `reconstruct(tokens: Token[]): string`

### Class: `CandidateFilter`
- `isCandidate(tokenValue: string, targetValue: string): boolean`

### Class: `WeightedDistanceCalculator`
- `calculateDistance(source: string, target: string, weightMatrix: WeightConfig): number`

### Class: `CorrectionEngine` (Orchestrator)
- `processCorpus(rawText: string, target: string, threshold: number): string`

## 4. Design Considerations
- **Punctuation:** Tokenizer must strip/store punctuation before calculation and reattach after.
- **Memory:** Use efficient string/buffer handling in Node.js to avoid GC bottlenecks during large repo processing.
- **Weight Matrix Tuning:** Empirically tune penalties (Case Mismatch, Substitution, Transposition) to balance Precision and Recall.
