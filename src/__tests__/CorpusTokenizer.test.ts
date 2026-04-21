import { describe, it, expect } from 'vitest';
import { CorpusTokenizer, Token } from '../CorpusTokenizer.js';

describe('CorpusTokenizer', () => {
  const tokenizer = new CorpusTokenizer();

  it('should tokenize simple words', () => {
    // Arrange
    const input = 'GitHub is great';
    
    // Act
    const tokens = tokenizer.tokenize(input);
    
    // Assert
    expect(tokens).toHaveLength(5);
    expect(tokens[0]).toEqual({ text: 'GitHub', isWord: true, startIndex: 0, endIndex: 6 });
    expect(tokens[1]).toEqual({ text: ' ', isWord: false, startIndex: 6, endIndex: 7 });
    expect(tokens[2]).toEqual({ text: 'is', isWord: true, startIndex: 7, endIndex: 9 });
    expect(tokens[3]).toEqual({ text: ' ', isWord: false, startIndex: 9, endIndex: 10 });
    expect(tokens[4]).toEqual({ text: 'great', isWord: true, startIndex: 10, endIndex: 15 });
  });

  it('should handle punctuation correctly', () => {
    // Arrange
    const input = 'Hello, GitHub!';
    
    // Act
    const tokens = tokenizer.tokenize(input);
    
    // Assert
    // "Hello" (W), ", " (NW), "GitHub" (W), "!" (NW)
    expect(tokens[0]).toEqual({ text: 'Hello', isWord: true, startIndex: 0, endIndex: 5 });
    expect(tokens[1]).toEqual({ text: ', ', isWord: false, startIndex: 5, endIndex: 7 });
    expect(tokens[2]).toEqual({ text: 'GitHub', isWord: true, startIndex: 7, endIndex: 13 });
    expect(tokens[3]).toEqual({ text: '!', isWord: false, startIndex: 13, endIndex: 14 });
  });

  it('should handle multiple spaces and newlines', () => {
    // Arrange
    const input = 'Line 1\n  Line 2';
    
    // Act
    const tokens = tokenizer.tokenize(input);
    
    // Assert
    expect(tokens.find(t => t.text === '\n  ')).toBeDefined();
  });

  it('should reconstruct the original string from tokens', () => {
    // Arrange
    const input = '  Hello, GitHub!  This is a test.\nNew line here.';
    const tokens = tokenizer.tokenize(input);
    
    // Act
    const reconstructed = tokenizer.reconstruct(tokens);
    
    // Assert
    expect(reconstructed).toBe(input);
  });

  it('should handle empty strings', () => {
    expect(tokenizer.tokenize('')).toEqual([]);
    expect(tokenizer.reconstruct([])).toBe('');
  });
});
