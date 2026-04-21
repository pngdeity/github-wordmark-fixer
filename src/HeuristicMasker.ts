import { ProseNode, MaskedRegion } from './types.js';

export class HeuristicMasker {
  private readonly rules: Array<{ pattern: RegExp; reason: string }> = [
    {
      // Matches standard URLs
      pattern: /https?:\/\/[^\s]+/g,
      reason: 'URL'
    },
    {
      // Matches text enclosed in backticks
      pattern: /`[^`]+`/g,
      reason: 'MarkdownCode'
    },
    {
      // Matches standard email addresses
      pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      reason: 'Email'
    }
  ];

  /**
   * Identifies and masks technical strings (URLs, emails, code) within a prose node.
   * 
   * @param node The ProseNode to process.
   * @returns A new ProseNode with updated masked regions (immutability preserved).
   */
  mask(node: ProseNode): ProseNode {
    const newMaskedRegions: MaskedRegion[] = [...node.maskedRegions];

    for (const rule of this.rules) {
      let match;
      // Reset the regex index before using it in a loop
      rule.pattern.lastIndex = 0;
      
      while ((match = rule.pattern.exec(node.rawText)) !== null) {
        newMaskedRegions.push({
          localStartIndex: match.index,
          localEndIndex: match.index + match[0].length,
          reason: rule.reason
        });
      }
    }

    return {
      ...node,
      maskedRegions: newMaskedRegions
    };
  }
}
