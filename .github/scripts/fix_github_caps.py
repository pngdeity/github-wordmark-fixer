#!/usr/bin/env python3

import os
import re
import sys

CORRECT_CAPITALIZATION = "GitHub"
# This regex is now only for the word "github", not for URLs or other contexts.
# The surrounding logic will handle when it's safe to apply.
BASE_REGEX = re.compile(r"\bgithub\b", re.IGNORECASE)

# A simple regex to find URLs.
URL_REGEX = re.compile(r"https?://[^\s\"']+", re.IGNORECASE)

# --- File Type Definitions ---
DOC_EXTENSIONS = {".md", ".txt", ".rst", ".html", ".htm"}
CODE_EXTENSIONS = {".py", ".c", ".h", ".cpp", ".hpp", ".js", ".ts", ".java", ".go", ".sh", ".yaml", ".yml"}
CODE_COMMENT_MARKERS = {
    ".py": "#", ".c": "//", ".h": "//", ".cpp": "//", ".hpp": "//",
    ".js": "//", ".ts": "//", ".java": "//", ".go": "//", ".sh": "#",
    ".yaml": "#", ".yml": "#",
}

IGNORE_DIRS = {".git", ".github", "node_modules", "vendor"}

def is_binary(filepath):
    """Check if a file is binary by looking for null bytes."""
    try:
        with open(filepath, "rb") as f:
            return b"\0" in f.read(1024)
    except IOError:
        return True

def protect_urls(content):
    """Finds all URLs and replaces them with a placeholder."""
    urls = URL_REGEX.findall(content)
    # Use a non-colliding placeholder
    placeholder = "__URL_PLACEHOLDER_{i}__"
    for i, url in enumerate(urls):
        content = content.replace(url, placeholder.format(i=i), 1)
    return content, urls

def unprotect_urls(content, urls):
    """Restores URLs from placeholders."""
    placeholder = "__URL_PLACEHOLDER_{i}__"
    for i, url in enumerate(urls):
        content = content.replace(placeholder.format(i=i), url, 1)
    return content

def fix_doc_file_content(content):
    """For documentation files, fix all occurrences."""
    return BASE_REGEX.sub(CORRECT_CAPITALIZATION, content)

def fix_code_file_content(content, extension):
    """
    For source code, only fix occurrences in full-line comments.
    This is a safe, conservative approach to avoid changing code identifiers.

    NOTE: This will not fix miscapitalizations in block comments (e.g., /* ... */)
    or in trailing comments that appear after code on the same line. This is a
    deliberate design choice to prioritize safety and avoid the complexity of
    a full language parser, which would be required to handle all cases correctly
    without the risk of breaking code.
    """
    comment_marker = CODE_COMMENT_MARKERS.get(extension)
    if not comment_marker:
        return content

    modified_lines = []
    lines = content.split('\n')
    for line in lines:
        if line.strip().startswith(comment_marker):
            modified_lines.append(BASE_REGEX.sub(CORRECT_CAPITALIZATION, line))
        else:
            modified_lines.append(line)
    return "\n".join(modified_lines)

def fix_file(filepath):
    _, extension = os.path.splitext(filepath)
    if extension not in DOC_EXTENSIONS and extension not in CODE_EXTENSIONS:
        return False

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            original_content = f.read()
    except IOError:
        return False

    # Protect URLs before doing any fixing
    protected_content, urls = protect_urls(original_content)

    if extension in DOC_EXTENSIONS:
        fixed_protected_content = fix_doc_file_content(protected_content)
    elif extension in CODE_EXTENSIONS:
        fixed_protected_content = fix_code_file_content(protected_content, extension)
    else:
        fixed_protected_content = protected_content

    # Unprotect URLs after fixing
    new_content = unprotect_urls(fixed_protected_content, urls)

    if new_content != original_content:
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Fixed capitalization in: {filepath}")
            return True
        except IOError:
            print(f"Error: Could not write to file {filepath}", file=sys.stderr)
    return False

def main():
    target_path = sys.argv[1] if len(sys.argv) > 1 else "."

    files_to_check = []
    if os.path.isfile(target_path):
        files_to_check.append(target_path)
    elif os.path.isdir(target_path):
        for root, dirs, files in os.walk(target_path):
            if os.path.basename(root) in IGNORE_DIRS and root != target_path:
                dirs[:] = []
                continue
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for filename in files:
                if filename.endswith((".golden", ".pristine")):
                    continue
                filepath = os.path.join(root, filename)
                try:
                    if not is_binary(filepath):
                        files_to_check.append(filepath)
                except IOError:
                    continue # Skip files we can't access
    else:
        print(f"Error: Path '{target_path}' is not a valid file or directory.", file=sys.stderr)
        sys.exit(1)

    files_modified = False
    for filepath in files_to_check:
        if fix_file(filepath):
            files_modified = True

    if files_modified:
        print("\nCapitalization fixes were applied.", file=sys.stderr)
        sys.exit(1)
    else:
        print("\nNo capitalization errors found.")
        sys.exit(0)

if __name__ == "__main__":
    main()
