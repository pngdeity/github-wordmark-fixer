import { MutationProposal } from './types.js';

export class FilePatcher {
  /**
   * Applies an array of MutationProposals to the raw code.
   * To prevent index drift, mutations are applied in reverse order
   * based on their globalStartIndex.
   * 
   * @param rawCode The original source code string.
   * @param mutations An array of MutationProposals.
   * @returns The patched source code string.
   */
  patch(rawCode: string, mutations: MutationProposal[]): string {
    if (mutations.length === 0) {
      return rawCode;
    }

    // Sort mutations in descending order by index
    const sortedMutations = [...mutations].sort(
      (a, b) => b.globalStartIndex - a.globalStartIndex
    );

    let patchedCode = rawCode;

    for (const mutation of sortedMutations) {
      const { globalStartIndex, removalLength, replacementString } = mutation;
      
      const before = patchedCode.substring(0, globalStartIndex);
      const after = patchedCode.substring(globalStartIndex + removalLength);
      
      patchedCode = before + replacementString + after;
    }

    return patchedCode;
  }
}
