export interface ProseNode {
    filePath: string;
    rawText: string;
    context?: string;         // Surrounding code context for ML inference
    globalStartIndex: number; 
    globalEndIndex: number;
    maskedRegions: MaskedRegion[]; 
}

export interface MaskedRegion {
    localStartIndex: number; // Relative to ProseNode.rawText
    localEndIndex: number;
    reason: string;           // e.g., "URL", "MarkdownCode"
}

export interface MutationProposal {
    filePath: string;
    globalStartIndex: number; // Absolute file index
    removalLength: number;
    replacementString: string;
}
