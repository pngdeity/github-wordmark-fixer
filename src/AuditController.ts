import { CorrectionEngine } from './CorrectionEngine.js';
import { ProseNode, MutationProposal } from './types.js';
import { WeightConfig } from './WeightedDistanceCalculator.js';

export class AuditController {
  constructor(private readonly engine: CorrectionEngine) {}

  /**
   * Audits a ProseNode, using the CorrectionEngine to find misspellings,
   * and generates MutationProposals for valid corrections that do not
   * overlap with any MaskedRegions.
   * 
   * @param node The parsed and masked ProseNode.
   * @param target The correct wordmark.
   * @param threshold The maximum distance threshold.
   * @param weights The weight configuration.
   * @returns An array of generated MutationProposals.
   */
  audit(
    node: ProseNode,
    target: string,
    threshold: number,
    weights: WeightConfig
  ): MutationProposal[] {
    const proposals: MutationProposal[] = [];

    // Since CorrectionEngine processes tokens and returns a string,
    // we should extract the proposals by exposing a method that returns the mutations.
    // However, to keep CorrectionEngine aligned with its spec, we'll tokenize here or
    // use a new method on CorrectionEngine.
    
    // As the orchestrator of the pipeline, we use the engine's components to find
    // proposals.
    
    const tokens = this.engine.tokenizer.tokenize(node.rawText);

    for (const token of tokens) {
      if (!token.isWord) continue;
      
      const isCandidate = this.engine.filter.isCandidate(token.text, target);
      if (!isCandidate) continue;

      const distance = this.engine.calculator.calculateDistance(token.text, target, weights);
      
      if (distance <= threshold) {
        // Check if the token falls inside any masked region
        const isMasked = node.maskedRegions.some(
          region => token.startIndex >= region.localStartIndex && token.endIndex <= region.localEndIndex
        );

        if (!isMasked) {
          proposals.push({
            filePath: node.filePath,
            globalStartIndex: node.globalStartIndex + token.startIndex,
            removalLength: token.endIndex - token.startIndex,
            replacementString: target
          });
        }
      }
    }

    return proposals;
  }
}
