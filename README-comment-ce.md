# Code Prose Auditor

A GitHub Action that audits comments and prose within source code files for quality and consistency.

## Features

- Scans multiple file types (Python, JavaScript, TypeScript, Java, C++, C, Markdown)
- Detects short or vague comments
- Identifies TODO comments without sufficient context
- Detects instances of "github" that should be capitalized as "GitHub"
- Documentation-specific checks for Markdown files:
  - Identifies HTTP links that should be HTTPS
  - Detects images missing alt text
  - Checks for inconsistent heading levels
- Generates detailed YAML reports
- Configurable file patterns and minimum comment length

## Usage

```yaml
name: Audit Code Prose

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Prose Audit
        uses: your-username/code-prose-auditor@v1
        with:
          path: 'src'  # Optional: path to scan
          file_patterns: '*.py,*.js,*.ts,*.md'  # Optional: file patterns to include
          min_comment_length: '10'  # Optional: minimum comment length
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `path` | Path to the directory containing source code files to audit | No | `.` |
| `file_patterns` | Comma-separated list of file patterns to include | No | `*.py,*.js,*.ts,*.java,*.cpp,*.h,*.md` |
| `min_comment_length` | Minimum length for comments to be considered meaningful | No | `10` |

## Outputs

| Output | Description |
|--------|-------------|
| `issues_found` | Number of issues found in the code prose |
| `report_path` | Path to the generated audit report |

## Report Format

The action generates a YAML report with the following structure:

```yaml
timestamp: "2024-03-14T12:00:00"
total_issues: 3
issues:
  - type: "short_comment"
    message: "Comment is too short (length: 5)"
    file: "src/example.py"
    line: 42
  - type: "vague_todo"
    message: "TODO comment lacks sufficient context"
    file: "src/example.js"
    line: 15
  - type: "github_capitalization"
    message: "Found 'github' that should be capitalized as 'GitHub'"
    file: "src/example.py"
    line: 42
    original_text: "This is a comment about github actions"
    start_pos: 20
    end_pos: 26
  - type: "insecure_link"
    message: "Found HTTP link that should be HTTPS"
    file: "docs/README.md"
    line: 15
    original_text: "[Example](http://example.com)"
    start_pos: 0
    end_pos: 25
  - type: "missing_alt_text"
    message: "Image is missing alt text"
    file: "docs/images.md"
    line: 8
    original_text: "![](image.png)"
    start_pos: 0
    end_pos: 15
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 