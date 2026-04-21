import { describe, it, expect } from 'vitest';
import { AuditController } from '../AuditController.js';
import { ProseNode, MutationProposal } from '../types.js';
import { CorrectionEngine } from '../CorrectionEngine.js';
import { CorpusTokenizer } from '../CorpusTokenizer.js';
import { CandidateFilter } from '../CandidateFilter.js';
import { WeightedDistanceCalculator, WeightConfig } from '../WeightedDistanceCalculator.js';

describe('AuditController', () => {
  const tokenizer = new CorpusTokenizer();
  const filter = new CandidateFilter();
  const calculator = new WeightedDistanceCalculator();
  const engine = new CorrectionEngine(tokenizer, filter, calculator);
  const controller = new AuditController(engine);
  const weights: WeightConfig = { insertion: 1, deletion: 1, substitution: 1, caseMismatch: 0.1, transposition: 0.5 };
  
  it('should generate MutationProposals for misspelled words', () => {
    const node: ProseNode = {
      filePath: 'test.ts',
      rawText: 'Fix this Github issue.',
      globalStartIndex: 100,
      globalEndIndex: 122,
      maskedRegions: []
    };

    const proposals = controller.audit(node, 'GitHub', 0.5, weights);
    
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toEqual({
      filePath: 'test.ts',
      // 'Fix this ' is 9 chars. 'Github' starts at index 9 local. Global = 100 + 9 = 109.
      globalStartIndex: 109,
      removalLength: 6,
      replacementString: 'GitHub'
    });
  });

  it('should ignore corrections inside masked regions', () => {
    const node: ProseNode = {
      filePath: 'test.ts',
      rawText: 'Check out `Github` for more.',
      globalStartIndex: 0,
      globalEndIndex: 28,
      maskedRegions: [{
        localStartIndex: 10,
        localEndIndex: 18,
        reason: 'MarkdownCode'
      }]
    };

    const proposals = controller.audit(node, 'GitHub', 0.5, weights);
    expect(proposals).toHaveLength(0);
  });
});
