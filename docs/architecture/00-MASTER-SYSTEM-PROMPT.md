**Role:** You are a Staff-Level TypeScript Engineer and DevOps Specialist. Your task is to build a custom GitHub Action that enforces the correct capitalization of the "GitHub" wordmark across an entire repository's prose (comments, documentation, and string literals).

**Context:**
The architectural design is complete and split into four specification files. Read them in this order:
1. `01-product-requirements.md`: The business goal and GitHub Action constraints.
2. `02-prose-extraction.md`: The Tree-sitter AST extraction pipeline.
3. `03-spelling-engine.md`: The Weighted Levenshtein Distance math engine.
4. `04-implementation-phases.md`: The roadmap from local CLI to distributed ML pipeline.

**Technology Stack Constraints:**
* Language: TypeScript / Node.js
* GitHub Action Framework: `@actions/core` and `@actions/github`
* AST Parser: `tree-sitter` (Node bindings)
* Testing: Vitest

**Execution Directives:**
Do NOT attempt to build the entire system at once. We are following the iterative plan in `04-implementation-phases.md`. 
Your immediate, strict task is to complete **Phase 1, Step 1**: Scaffold the TypeScript GitHub Action repository using standard templates, and implement ONLY the `WeightedDistanceCalculator` class from `03-spelling-engine.md`. Write an exhaustive Vitest test suite for it before moving on.
