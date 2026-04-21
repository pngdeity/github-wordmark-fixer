### `cleanup.md`

**Objective:** Before writing any application code, you must initialize the workspace and consolidate the raw, contradictory source files into a unified, single-source-of-truth documentation directory. 

**Available Raw Files:**
* `implementation-handoff.md`
* `get-prose-corpus-handoff.md`
* `specification-draft.md`
* `auditing-prose-handoff.md`
* `TODO`

**Execution Directives:**
Please execute the following steps in order. Do not proceed to Step 2 until Step 1 is complete.

1. **Create the Architecture Directory:** Create a new directory structure: `/docs/architecture/`.

2. **Draft Product Requirements (`01-product-requirements.md`):**
   * Read `specification-draft.md` and the `TODO` file.
   * Extract the core business logic (the GitHub wordmark rules and the requirement to build a GitHub Action using the official JavaScript/TypeScript templates).
   * **CRITICAL:** Ignore and discard the contradictory logic in `specification-draft.md` regarding an "edit distance of 1". The system will use the Weighted Levenshtein approach instead.
   * Save the cleaned, unified business requirements into `/docs/architecture/01-product-requirements.md`.

3. **Migrate and Update the Extraction Pipeline (`02-prose-extraction.md`):**
   * Read `get-prose-corpus-handoff.md`.
   * Update all references to the tech stack. Remove mentions of C# and Roslyn. Replace them with Node.js, TypeScript, and the `tree-sitter` npm package.
   * Save the updated document to `/docs/architecture/02-prose-extraction.md`.

4. **Migrate and Update the Spelling Engine (`03-spelling-engine.md`):**
   * Read `auditing-prose-handoff.md`.
   * Update the tech stack requirements to reflect a Node.js/TypeScript implementation. 
   * Save the updated document to `/docs/architecture/03-spelling-engine.md`.

5. **Migrate the Implementation Plan (`04-implementation-phases.md`):**
   * Read `implementation-handoff.md`.
   * Save it exactly as-is to `/docs/architecture/04-implementation-phases.md`.

6. **Generate the Master Prompt (`00-MASTER-SYSTEM-PROMPT.md`):**
   * Create this file in the `/docs/architecture/` directory.
   * Populate it with the following exact text:
     ```markdown
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
     ```

7. **Cleanup and Handoff:**
   * Delete the five original raw source files.
   * Pause execution, output a summary of the newly created `/docs/architecture/` directory structure, and confirm that you are ready to begin Phase 1 as dictated by the Master System Prompt.
