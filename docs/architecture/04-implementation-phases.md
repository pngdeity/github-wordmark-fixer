---

### 1. Extraction & Intent Classification

**The "Safe" Path: Deterministic AST & Regex Heuristics**
This is how 95% of production linters operate. It is fast, predictable, and requires no specialized hardware.
* **The Tech:** **Tree-sitter** (for AST generation) paired with standard Regular Expressions.
* **Implementation Details:**
    * Use the Tree-sitter bindings for your language (e.g., `tree-sitter-c-sharp`, `tree-sitter-javascript`).
    * Write a standard query `(comment) @comment` to extract the text.
    * Apply a strict chain of regex exclusions (e.g., `https?:\/\/[^\s]+` for URLs) to mask technical strings.
    * If the text passes the regex filters, pass it to your Levenshtein calculator. 

**The "Flex" Path: Local ML Inference (Bimodal Transformers)**
You replace the static regex exclusions with a machine learning model that actually "reads" the code to determine context.
* **The Tech:** **CodeBERT** (or RoBERTa) executed locally via **ONNX Runtime**.
* **Implementation Details:**
    * Download a pre-trained CodeBERT model and convert it to the ONNX format (which allows for fast, dependency-free inference in C#, Python, or Rust).
    * When Tree-sitter extracts a comment, do not just pass the comment. Pass the comment *and* the immediately succeeding function signature to the ONNX runtime.
    * The model outputs a probability tensor. You write a classifier: `if (intent.IsExplanatoryProse > 0.90) { RunSpellCheck(); }`.
    * *The Flex:* You demonstrate on-device edge AI inference without relying on paid OpenAI/Anthropic APIs.

---

### 2. Concurrency & Distributed Processing

**The "Safe" Path: Local Asynchronous Multi-Threading**
Monorepos can be large, but modern CPUs have plenty of cores. You don't *need* a distributed cluster to parse 10,000 files; you just need good thread management.
* **The Tech:** In-memory Thread Pools (e.g., C# `Parallel.ForEachAsync` or `System.Threading.Channels`, or Go Routines).
* **Implementation Details:**
    * The `FileTriager` pushes matching file paths into an in-memory Queue/Channel.
    * Spin up a pool of worker threads (matching your CPU core count).
    * Workers pull paths from the queue, parse the AST, and calculate distances concurrently.
    * Workers push `MutationProposal` objects to a single, thread-safe writer queue to prevent file-locking collisions on disk.

**The "Flex" Path: Event-Driven Microservices**
You treat the codebase like a continuous stream of data flowing through a distributed enterprise system.
* **The Tech:** **Docker**, **RabbitMQ** (or Apache Kafka), and **MassTransit** (if using .NET) or **Celery** (Python).
* **Implementation Details:**
    * Write an `Ingestor` service that scans a repo and publishes a `FileDiscoveredEvent` to RabbitMQ.
    * Spin up multiple Docker containers running your `Worker` service. These workers subscribe to the queue, process the file, and publish a `MutationCalculatedEvent`.
    * A final `Patcher` service listens for mutations and applies them to the repo.
    * *The Flex:* You demonstrate message durability, competing consumers, dead-letter queues (for files that crash the parser), and horizontal scalability.

---

### 3. CI/CD Integration

**The "Safe" Path: The Blocking Pipeline Check**
This is the standard approach for tools like Prettier, ESLint, or Black. If the code is wrong, the build turns red.
* **The Tech:** Standard bash script executed within a **GitHub Action** or **GitLab CI** pipeline.
* **Implementation Details:**
    * Create a `.github/workflows/spellcheck.yml` file.
    * The action runs your CLI tool in "dry-run" mode against the files changed in the Pull Request.
    * If the tool finds an uncorrected misspelling of "GitHub", it writes the error to `stdout` and exits with code `1`. The PR is blocked from merging.

**The "Flex" Path: Automated PR Code Reviews (Bot Integration)**
Instead of just failing the build, your system acts as an autonomous senior developer, suggesting the exact fix directly on the offending line of code.
* **The Tech:** **GitHub REST API** (specifically the Pull Request Review Comments endpoints).
* **Implementation Details:**
    * Run your tool in the CI pipeline. When it generates a `MutationProposal`, do *not* exit with code `1`.
    * Use the GitHub API to POST a review comment to the specific PR, using the file path and line number from your AST.
    * Format the comment using GitHub's ````suggestion` Markdown syntax.
    * *The Flex:* The developer opening the PR sees a comment from your bot that says: *"Did you mean GitHub?"* with a one-click "Commit Suggestion" button right in the GitHub UI.

---

### 4. Observability & Telemetry

**The "Safe" Path: Structured JSON Logging**
Standard practice for command-line tools and simple services.
* **The Tech:** **Serilog** (C#) or **Winston** (Node.js).
* **Implementation Details:**
    * Instead of `Console.WriteLine("Found typo")`, emit structured JSON logs: `{"level":"info", "event":"typo_found", "file":"main.cs", "distance": 0.2}`.
    * This allows the logs to be easily ingested by standard log aggregators (Datadog, Splunk, etc.) if deployed in an enterprise.

**The "Flex" Path: Distributed Tracing & Live Metrics**
You treat your analysis engine like a highly available web service that requires real-time health monitoring.
* **The Tech:** **OpenTelemetry (OTel)**, **Prometheus**, and **Grafana** (all orchestrated via Docker Compose).
* **Implementation Details:**
    * Instrument your code with the OpenTelemetry SDK. 
    * Create **Counters** (e.g., `files_parsed_total`, `typos_corrected_total`) and **Histograms** (e.g., `ast_parse_duration_ms`).
    * If using the RabbitMQ Flex path, use OTel to generate distributed traces, showing exactly how long a file spent in the queue vs. in the ML model.
    * Provide a `docker-compose.yml` in your repository that spins up Prometheus (to scrape your metrics) and Grafana (to display them on a beautiful dark-mode dashboard).
    * *The Flex:* You prove you understand Day 2 operations—how software is maintained and monitored after it is deployed.

---

### Architectural Overview: The Incremental Implementation Plan

To build this without drowning in complexity, you must build the "Safe" system first, and then swap the "Flex" components in layer by layer.

**Phase 1: The Core Deterministic Engine (Local CLI)**
* *Goal:* Build a tool that actually works on your local machine.
* *Architecture:* Implement the "Safe" Distributed path (local multi-threading) + the "Safe" Intent path (Tree-sitter + Regex) + "Safe" Observability (JSON logging).
* *Milestone:* You can point your CLI at a local folder, and it correctly replaces "Github" with "GitHub" in comments instantly, without breaking code.

**Phase 2: The DevOps Hook (CI/CD Bot)**
* *Goal:* Move the tool from your local machine to the cloud.
* *Architecture:* Implement the "Flex" CI/CD path. Keep the core engine from Phase 1, but wrap it in a GitHub Action that uses the GitHub API to post inline suggestions.
* *Milestone:* Your repository has a working bot that reviews Pull Requests autonomously.

**Phase 3: The ML Brain (Semantic Upgrade)**
* *Goal:* Eliminate the edge-case false positives.
* *Architecture:* Implement the "Flex" Intent path. Replace your Regex exclusion heuristics with the local ONNX CodeBERT model.
* *Milestone:* The system correctly ignores a comment like `// github_api_key goes here` by recognizing the contextual intent.

**Phase 4: The Enterprise Scale (Distributed System)**
* *Goal:* Show off your architecture chops.
* *Architecture:* Implement the "Flex" Distributed path and "Flex" Observability. Tear apart the Phase 1 monolith. Put the File Triager, the ML Worker, and the Patcher into separate Docker containers. Wire them together with RabbitMQ. Add OpenTelemetry and Grafana.
* *Milestone:* You can process a 100,000-file repository across multiple containers while watching the metrics flow into a live Grafana dashboard.
