# GitHub Capitalization Fixer

This repository contains a script and a GitHub Action to automatically find and correct miscapitalized instances of "GitHub" within a codebase.

## Rationale

Correctly capitalizing "GitHub" is important for maintaining brand consistency and professionalism in documentation and code comments. According to the official [GitHub Brand Toolkit](https://brand.github.com/foundations/logo):

> **GitHub is always one word with a capitalized G and H.**

This script was created to enforce this guideline automatically, ensuring that all references to the product, company, or service are formatted correctly.

## How it Works

The script (`.github/scripts/fix_github_caps.py`) intelligently scans files and applies corrections based on file type:

-   **Documentation Files (`.md`, `.html`, etc.):** Corrects all instances of "github".
-   **Source Code Files (`.py`, `.c`, etc.):** To avoid breaking code, it only corrects instances found in full-line comments (e.g., lines starting with `#` or `//`).
-   **URL Protection:** The script will not alter the capitalization of "github" when it appears as part of a URL (e.g., `https://github.com`).

The repository also includes a runnable test suite (`run_tests.sh`) to verify this behavior.

## Usage

### Local Usage

You can run the script locally to fix files in any directory.

1.  Clone this repository or download the `.github/scripts/fix_github_caps.py` script.
2.  Run the script from your terminal, providing an optional path to the directory you want to check. If no path is provided, it will check the current directory.

```bash
# Check the current directory
python3 .github/scripts/fix_github_caps.py

# Check a specific directory
python3 .github/scripts/fix_github_caps.py ./path/to/your/project
```

### GitHub Action Integration

You can integrate this script into any repository to automatically check for and fix capitalization on every push and pull request.

1.  **Copy the script and workflow file** into your own repository. You need to create the following directory structure and files:

    -   `.github/scripts/fix_github_caps.py` (copy the script from this repository)
    -   `.github/workflows/check-github-capitalization.yml`

2.  **Add the workflow content.** The content of `check-github-capitalization.yml` should be:

    ```yaml
    name: Check GitHub Capitalization

    on:
      push:
      pull_request:

    jobs:
      lint:
        name: Check for GitHub miscapitalization
        runs-on: ubuntu-latest
        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Set up Python
            uses: actions/setup-python@v4
            with:
              python-version: '3.x'

          - name: Run capitalization fixer
            run: python3 .github/scripts/fix_github_caps.py
    ```

3.  **Commit the files.** Once these files are committed to your repository, the action will run automatically.

**How the Action Behaves:**

-   If the script finds and fixes any files, it will exit with a non-zero status code.
-   This will cause the "Check for GitHub miscapitalization" step to fail in your pull request or push, alerting you that automated fixes have been made.
-   You will then need to pull the changes from your branch, review them, and commit the fixes.
