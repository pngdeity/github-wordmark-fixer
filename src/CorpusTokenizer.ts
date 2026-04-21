export interface Token {
  text: string;
  isWord: boolean;
  startIndex: number;
  endIndex: number;
}

export class CorpusTokenizer {
  /**
   * Tokenizes raw text into words and non-word sequences (whitespace/punctuation).
   * 
   * @param rawText The input string to tokenize.
   * @returns An array of Token objects.
   */
  tokenize(rawText: string): Token[] {
    if (!rawText) {
      return [];
    }

    // This regex matches sequences of alphanumeric characters as "words"
    // and everything else as "separators".
    // We use a capturing group to keep the separators in the split result.
    const parts = rawText.split(/([a-zA-Z0-9]+)/);
    
    let currentIndex = 0;
    const tokens: Token[] = [];

    for (const part of parts) {
      if (part === '') continue;
      
      const length = part.length;
      tokens.push({
        text: part,
        isWord: /^[a-zA-Z0-9]+$/.test(part),
        startIndex: currentIndex,
        endIndex: currentIndex + length
      });
      currentIndex += length;
    }

    return tokens;
  }

  /**
   * Reconstructs the original string from an array of tokens.
   * 
   * @param tokens The array of Token objects.
   * @returns The concatenated string.
   */
  reconstruct(tokens: Token[]): string {
    return tokens.map(token => token.text).join('');
  }
}
