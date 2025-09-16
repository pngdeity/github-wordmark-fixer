#!/usr/bin/env python3

import os
import re
import sys

# The correctly capitalized version of the word.
CORRECT_CAPITALIZATION = "GitHub"

# A regex to find all miscapitalized versions of the word.
# \b ensures we match whole words only.
# The negative lookbehind/ahead (?<!-) and (?!-) prevent matching
# when the word is part of a hyphenated string.
REGEX = re.compile(r"(?<!-)\bgithub\b(?!-)", re.IGNORECASE)

# Directories to ignore.
IGNORE_DIRS = {".git", ".github", "node_modules", "vendor"}

def is_binary(filepath):
    """
    Check if a file is binary.
    A simple heuristic is to check for null bytes.
    """
    try:
        with open(filepath, "rb") as f:
            chunk = f.read(1024)
            return b"\0" in chunk
    except IOError:
        # If we can't open the file, assume it's not something we should process.
        return True

def fix_file(filepath):
    """
    Reads a file, fixes miscapitalizations, and writes it back if changed.
    Returns True if the file was modified, False otherwise.
    """
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            original_content = f.read()
    except IOError:
        # Unable to read the file, so we can't fix it.
        return False

    # Perform the replacement.
    # We use a lambda to replace only if the original match is not already correct.
    # This preserves the file's modification time if no changes are needed.
    # However, a simple re.sub is more direct. Let's reconsider.
    # The prompt implies we fix all miscapitalizations.
    # If we do `re.sub`, `GitHub` will be replaced with `GitHub`, which is fine.
    # The check `new_content != original_content` will handle this.
    new_content = REGEX.sub(CORRECT_CAPITALIZATION, original_content)

    if new_content != original_content:
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Fixed capitalization in: {filepath}")
            return True
        except IOError:
            print(f"Error: Could not write to file {filepath}", file=sys.stderr)
            return False
    return False

def main():
    """
    Main function to traverse the repository and fix files.
    """
    files_modified = False
    for root, dirs, files in os.walk("."):
        # Modify the dir list in-place to prune the search
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for filename in files:
            filepath = os.path.join(root, filename)
            if is_binary(filepath):
                continue

            if fix_file(filepath):
                files_modified = True

    if files_modified:
        print("\n" + "="*30)
        print("Capitalization fixes were applied.")
        print("Please review and commit the changes.")
        print("="*30)
        sys.exit(1)
    else:
        print("No capitalization errors found.")
        sys.exit(0)

if __name__ == "__main__":
    main()
