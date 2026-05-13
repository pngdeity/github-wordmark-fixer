# Product Requirements: GitHub Wordmark Fixer

## Objective
Build a custom GitHub Action that enforces the correct capitalization of the "GitHub" wordmark across an entire repository's prose.

## Core Business Logic
- **Wordmark Specification:** The "GitHub" name must always have the first and fourth characters uppercase ("G" and "H") and all other characters lowercase.
- **Allowed Form:** "GitHub"
- **Disallowed Forms:** Any other capitalization (e.g., "Github", "gitHub", "github", "GithuB") or near-misses identified by the spelling engine.
- **Scope:** Prose language within a software repository, specifically:
    - Source code comments.
    - String literals (where safe).
    - Rendered content in documentation (Markdown, etc.).
    - Plaintext files.
- **Correction Logic:** The system must identify erroneous usages and correct them to "GitHub".

## Technical Constraints
- **Platform:** GitHub Action.
- **Framework:** Must be built using the official GitHub JavaScript/TypeScript Action templates (using `@actions/core` and `@actions/github`).
- **Algorithm:** Use a **Weighted Levenshtein Distance** approach to identify candidates for correction. The previous requirement for a simple "edit distance of 1" is superseded by this weighted approach.
- **Safe Extraction:** Must use an AST-aware extraction pipeline to avoid breaking code syntax, URLs, or technical identifiers.

## Success Criteria
- All occurrences of the GitHub wordmark in prose are properly capitalized.
- The GitHub Action is idempotent (running it twice on the same input produces the same output).
- No functional code, URLs, or package identifiers are corrupted during the fixing process.
