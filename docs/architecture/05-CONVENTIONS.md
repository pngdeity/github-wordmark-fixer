### `05-CONVENTIONS.md`

**Objective:** This document establishes the engineering standards, architectural patterns, and behavioral directives for all code authored in this repository. Both human contributors and AI agents must strictly adhere to these rules to ensure the codebase remains scalable, maintainable, and robust.

#### 1. TypeScript & Type Safety
* **Strict Mode is Absolute:** The `tsconfig.json` must have `"strict": true`. 
* **The Ban on `any`:** The `any` type is strictly forbidden. If the shape of data is truly unknown at compile time (e.g., parsing raw JSON or reading user inputs), use `unknown` and write explicit Type Guards or use a schema validation library (like Zod) to narrow the type.
* **Types vs. Interfaces:** Use `interface` for object shapes and class contracts (especially for Dependency Injection). Use `type` for unions, intersections, and utility types.
* **Explicit Return Types:** All functions and methods must have an explicitly declared return type. Do not rely on implicit inference for boundaries.

#### 2. Architecture & Data Flow
* **Functional Core, Imperative Shell:** Structure the application to strictly separate pure logic from side effects. All business logic (e.g., AST traversal logic, Levenshtein math, regex masking heuristics) must reside in a pure, immutable "functional core." All I/O operations, state mutations, and side effects (e.g., reading/writing files, GitHub API network calls, logging) must be pushed to the outer boundary into an "imperative shell." This guarantees that the most complex logic remains deterministically testable.
* **Immutability First:** Treat all data as immutable. Do not mutate arrays or objects in place. Use map/filter/reduce or the spread operator to create new instances. This is especially critical when analyzing the Abstract Syntax Tree (AST).
* **Pure Functions:** Functions within the functional core must be pure. They should take inputs, return outputs, and produce zero side effects.
* **Dependency Injection (DI):** Decouple logic from execution context. Classes should receive their dependencies via constructors, not instantiate them internally (e.g., `AuditController` receives a `DistanceCalculator` instance; it does not call `new DistanceCalculator()` itself).
* **Small, Single-Purpose Functions:** Functions should do one thing and do it well. If a function exceeds 40-50 lines, it is a code smell and must be refactored into smaller, testable units.

#### 3. Error Handling
* **Fail Fast and Loud:** Validate inputs at the boundary of the application (e.g., GitHub Action inputs). If an input is invalid, throw a descriptive error immediately.
* **No Silent Catch Blocks:** A `catch` block must never be empty. If an error is caught and safely recovered from, it must still be logged with contextual metadata (file path, line number, input state).
* **Semantic Errors:** Extend the native `Error` class to create custom, domain-specific errors (e.g., `AstParsingError`, `FileLockError`).

#### 4. Testing (Vitest)
* **Test-Driven Development (TDD):** Write the Vitest specification (`.spec.ts`) before implementing the actual class logic. 
* **Arrange-Act-Assert:** Structure all test blocks using the AAA pattern. Keep the setup, execution, and verification phases visually distinct.
* **Mock Boundaries, Not Internals:** Because of the Functional Core, Imperative Shell pattern, the core logic should require zero mocking. Only mock external I/O (filesystem reads/writes, GitHub API network requests) at the imperative shell boundary to ensure tests run instantly and deterministically.

#### 5. AI Agent Directives
* **Ask Before Guessing:** If you are unsure about an architectural decision, an edge case, or a missing requirement, stop and ask the human orchestrator for clarification. Do not hallucinate requirements.
* **Iterative Delivery:** Do not attempt to write the entire system in one massive output. Write one file or one class at a time, write the tests, and wait for human review.
* **No Deprecated Code:** Ensure all imported libraries and native Node modules reflect the most current, stable syntax (e.g., use `node:fs/promises` instead of the legacy callback-based `fs`).
