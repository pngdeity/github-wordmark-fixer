#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

TEST_DIR="tests"
FIXER_SCRIPT=".github/scripts/fix_github_caps.py"
SUCCESS=true

# Loop through each test case
for pristine_file in $(find $TEST_DIR -name "*.pristine"); do
    test_file=${pristine_file%.pristine}
    golden_file=${test_file}.golden

    echo "=== RUNNING TEST: $(basename $test_file) ==="

    # 1. Reset test file to its pristine state
    echo "  -> Resetting $test_file..."
    cp "$pristine_file" "$test_file"

    # 2. Run the fixer script on the single test file
    echo "  -> Running fixer script..."
    # Use a subshell to capture output and exit code
    fixer_output=$(python3 $FIXER_SCRIPT "$test_file" 2>&1) || true
    echo "$fixer_output"

    # 3. Check for differences against the golden file
    echo "  -> Comparing result with .golden file..."
    diff_output=$(diff -u "$test_file" "$golden_file" || true)

    if [ -n "$diff_output" ]; then
        echo "  !!! TEST FAILED: $test_file does not match $golden_file !!!"
        echo "--- DIFF ---"
        echo "$diff_output"
        echo "------------"
        SUCCESS=false
    else
        echo "  --- TEST PASSED: $test_file matches .golden file."
    fi
    echo ""
done

# Final result
echo ""
if [ "$SUCCESS" = true ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed."
    exit 1
fi
