import { MutationProposal } from '../types.js';

export interface FileDiscoveredEvent {
    filePath: string;
    repoPath: string;
}

export interface MutationCalculatedEvent {
    filePath: string;
    proposals: MutationProposal[];
}
