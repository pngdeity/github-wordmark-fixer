export class CandidateFilter {
  /**
   * Rapidly determines if a token is a candidate for "GitHub" wordmark correction.
   * 
   * @param tokenValue The string value of the token to check.
   * @param targetValue The correct wordmark (e.g., "GitHub").
   * @returns True if the token is a potential misspelling or case-incorrect version of the target.
   */
  isCandidate(tokenValue: string, targetValue: string): boolean {
    // If it's already exactly the target, it's not a candidate for "correction"
    if (tokenValue === targetValue) {
      return false;
    }

    const lowerToken = tokenValue.toLowerCase();
    const lowerTarget = targetValue.toLowerCase();

    // Fast-pass: Check if it contains the target (case-insensitive)
    // or if the length is within a reasonable range (target length +/- 2)
    const lengthDiff = Math.abs(tokenValue.length - targetValue.length);
    if (lengthDiff > 2) {
      return false;
    }

    // Spec: "rapid case-insensitive check for github"
    // Also allow potential typos if they contain "git" or "hub"
    return lowerToken === lowerTarget || lowerToken.includes('git') || lowerToken.includes('hub');
  }
}
