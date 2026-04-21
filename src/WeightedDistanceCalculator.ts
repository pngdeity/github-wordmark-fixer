export interface WeightConfig {
  insertion: number;
  deletion: number;
  substitution: number;
  caseMismatch: number;
  transposition: number;
}

export class WeightedDistanceCalculator {
  /**
   * Calculates the weighted Damerau-Levenshtein distance between two strings.
   * 
   * @param source The original string.
   * @param target The target string to compare against.
   * @param weights Configuration for the cost of each edit operation.
   * @returns The minimum edit cost to transform source into target.
   */
  calculateDistance(source: string, target: string, weights: WeightConfig): number {
    const m = source.length;
    const n = target.length;

    // Handle empty strings
    if (m === 0) return n * weights.insertion;
    if (n === 0) return m * weights.deletion;

    // dp[i][j] will be the edit distance between source[0..i-1] and target[0..j-1]
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    // Base cases: transformations to/from empty strings
    for (let i = 0; i <= m; i++) dp[i][0] = i * weights.deletion;
    for (let j = 0; j <= n; j++) dp[0][j] = j * weights.insertion;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const sourceChar = source[i - 1];
        const targetChar = target[j - 1];

        if (sourceChar === targetChar) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          const isCaseMismatch = sourceChar.toLowerCase() === targetChar.toLowerCase();
          const subCost = isCaseMismatch ? weights.caseMismatch : weights.substitution;

          dp[i][j] = Math.min(
            dp[i - 1][j] + weights.deletion,    // Deletion
            dp[i][j - 1] + weights.insertion,   // Insertion
            dp[i - 1][j - 1] + subCost          // Substitution or Case Mismatch
          );

          // Check for transposition (Damerau-Levenshtein)
          if (
            i > 1 &&
            j > 1 &&
            source[i - 1] === target[j - 2] &&
            source[i - 2] === target[j - 1]
          ) {
            dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + weights.transposition);
          }
        }
      }
    }

    return dp[m][n];
  }
}
