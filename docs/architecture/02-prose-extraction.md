# Software Specification: Code-Safe Prose Extraction Pipeline (Node.js/TypeScript)

## 1. Executive Summary
**Objective:** Implement a robust, code-safe extraction pipeline that isolates human-readable prose (comments, documentation, and string literals) from source code repositories.
**Tech Stack:** Node.js, TypeScript, and `tree-sitter`.

## 2. Core Architecture & Data Flow
The pipeline consists of five sequential stages:

### Stage 1: File-Level Triage (`FileTriager`)
- **Responsibility:** Isolate files containing the target string "github" (case-insensitive).
- **Logic:** Apply `.gitignore` rules, exclude binary files and lockfiles, and perform a fast substring search.

### Stage 2: Structural AST Extraction (`ASTExtractor`)
- **Responsibility:** Use `tree-sitter` to parse source code and extract nodes strictly classified as comments, docstrings, or string literals.
- **Inputs:** Raw file contents and language-specific grammar.
- **Outputs:** `ProseNode` objects with raw text and exact positional metadata (line/column/character index).

### Stage 3: Sub-String Heuristic Masking (`HeuristicMasker`)
- **Responsibility:** Protect technical strings (URLs, emails, code backticks, package identifiers like `user/repo`) using Regular Expressions.
- **Outputs:** Modified `ProseNode` with `MaskedRegions`.

### Stage 4: Orchestration & Auditing (`AuditController`)
- **Responsibility:** Feed sanitized text to the `SpellingNormalizationEngine`.
- **Logic:** Verify corrections do not fall within `MaskedRegions`.
- **Outputs:** `MutationProposal` objects with file path, index, length, and replacement string.

### Stage 5: AST-Aware Reconstruction (`FilePatcher`)
- **Responsibility:** Apply mutations back to disk in reverse index order to preserve positional integrity.

## 3. Required Data Structures

```typescript
interface ProseNode {
    filePath: string;
    rawText: string;
    globalStartIndex: number; 
    globalEndIndex: number;
    maskedRegions: MaskedRegion[]; 
}

interface MaskedRegion {
    localStartIndex: number; // Relative to ProseNode.rawText
    localEndIndex: number;
    reason: string;           // e.g., "URL", "MarkdownCode"
}

interface MutationProposal {
    filePath: string;
    globalStartIndex: number; // Absolute file index
    removalLength: number;
    replacementString: string;
}
```
