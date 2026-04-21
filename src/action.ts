import * as core from '@actions/core';
import * as github from '@actions/github';
import { promises as fs } from 'node:fs';
import { ASTExtractor } from './ASTExtractor.js';
import { HeuristicMasker } from './HeuristicMasker.js';
import { AuditController } from './AuditController.js';
import { CorrectionEngine } from './CorrectionEngine.js';
import { CorpusTokenizer } from './CorpusTokenizer.js';
import { CandidateFilter } from './CandidateFilter.js';
import { WeightedDistanceCalculator } from './WeightedDistanceCalculator.js';
import { MLIntentClassifier } from './MLIntentClassifier.js';
import { MutationProposal } from './types.js';

export async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token', { required: true });
    const threshold = parseFloat(core.getInput('threshold') || '0.5');
    const useML = core.getInput('use-ml') === 'true';

    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.eventName !== 'pull_request') {
      core.info('Action not running in a pull request context. Skipping.');
      return;
    }

    const prNumber = context.payload.pull_request?.number;
    if (!prNumber) {
      throw new Error('Pull request number not found in context.');
    }

    // Get modified files in PR
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber
    });

    const targetFiles = files.filter(f => f.status !== 'removed' && f.filename.endsWith('.ts'));

    const extractor = new ASTExtractor();
    const masker = new HeuristicMasker();
    const classifier = new MLIntentClassifier();
    
    if (useML) {
      core.info('Initializing ML Intent Classifier (CodeBERT)...');
      await classifier.initialize();
    }

    const tokenizer = new CorpusTokenizer();
    const filter = new CandidateFilter();
    const calculator = new WeightedDistanceCalculator();
    const engine = new CorrectionEngine(tokenizer, filter, calculator);
    const auditor = new AuditController(engine);

    const weights = {
      insertion: 1.0,
      deletion: 1.0,
      substitution: 1.0,
      caseMismatch: 0.1,
      transposition: 0.5
    };

    let foundIssues = false;

    for (const file of targetFiles) {
      core.info(`Processing file: ${file.filename}`);
      const rawCode = await fs.readFile(file.filename, 'utf-8');
      
      // Stage 2: Extract
      const nodes = extractor.extract(rawCode, file.filename);
      
      const allProposals: MutationProposal[] = [];

      for (const node of nodes) {
        // Stage 3: ML Brain (Semantic Upgrade)
        if (useML) {
          const intentScore = await classifier.classify(node);
          if (intentScore < 0.90) {
            core.info(`Skipping node due to low intent score (${intentScore.toFixed(2)})`);
            continue;
          }
        }

        // Stage 3.1: Mask (Safe Path)
        const maskedNode = masker.mask(node);
        
        // Stage 4: Audit
        const proposals = auditor.audit(maskedNode, 'GitHub', threshold, weights);
        allProposals.push(...proposals);
      }

      // Group proposals by line to avoid overlapping suggestions
      const proposalsByLine = new Map<number, MutationProposal[]>();
      for (const proposal of allProposals) {
        const precedingText = rawCode.substring(0, proposal.globalStartIndex);
        const lineNumber = precedingText.split('\n').length;
        if (!proposalsByLine.has(lineNumber)) {
          proposalsByLine.set(lineNumber, []);
        }
        proposalsByLine.get(lineNumber)!.push(proposal);
      }

      // Get modified lines in this PR to avoid commenting on unmodified code
      const changedLines = getChangedLines(file.patch);

      for (const [lineNumber, lineProposals] of proposalsByLine) {
        if (!changedLines.has(lineNumber)) {
          core.info(`Skipping line ${lineNumber} as it was not modified in this PR.`);
          continue;
        }

        foundIssues = true;
        
        // Sort descending by start index to apply replacements without invalidating following indices
        lineProposals.sort((a, b) => b.globalStartIndex - a.globalStartIndex);

        const firstProposal = lineProposals[0];
        const precedingText = rawCode.substring(0, firstProposal.globalStartIndex);
        const lineStart = precedingText.lastIndexOf('\n') + 1;
        const lineEndIndex = rawCode.indexOf('\n', firstProposal.globalStartIndex);
        const lineEnd = lineEndIndex === -1 ? rawCode.length : lineEndIndex;
        
        const originalLine = rawCode.substring(lineStart, lineEnd);
        let suggestedLine = originalLine;

        for (const proposal of lineProposals) {
          const localIndexInLine = proposal.globalStartIndex - lineStart;
          suggestedLine = suggestedLine.substring(0, localIndexInLine) + 
                          proposal.replacementString + 
                          suggestedLine.substring(localIndexInLine + proposal.removalLength);
        }

        // Formulate suggestion comment
        const commentBody = `Did you mean \`GitHub\`?\n\n\`\`\`suggestion\n${suggestedLine}\n\`\`\``;

        await octokit.rest.pulls.createReviewComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: prNumber,
          commit_id: context.payload.pull_request?.head.sha,
          path: file.filename,
          body: commentBody,
          line: lineNumber,
          side: 'RIGHT'
        });
      }
    }

    if (foundIssues) {
      core.setFailed('Found incorrect capitalization of GitHub in the codebase. Please review the inline comments.');
    } else {
      core.info('No incorrect capitalization of GitHub found.');
    }

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
    else core.setFailed(String(error));
  }
}

/**
 * Parses a unified diff patch to identify which line numbers (post-image) were added or modified.
 */
function getChangedLines(patch: string | undefined): Set<number> {
  const lines = new Set<number>();
  if (!patch) return lines;

  const chunks = patch.split('\n');
  let currentLine = 0;

  for (const line of chunks) {
    if (line.startsWith('@@')) {
      const match = line.match(/\+(\d+)/);
      if (match) {
        currentLine = parseInt(match[1], 10) - 1;
      }
    } else if (line.startsWith('+')) {
      currentLine++;
      lines.add(currentLine);
    } else if (!line.startsWith('-')) {
      currentLine++;
    }
  }
  return lines;
}

// Support running directly or via tests
if (process.env.NODE_ENV !== 'test') {
  run();
}
