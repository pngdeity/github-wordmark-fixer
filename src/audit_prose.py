#!/usr/bin/env python3

import os
import sys
import glob
import re
from pathlib import Path
from typing import List, Dict, Any
import yaml
from datetime import datetime

class ProseAuditor:
    def __init__(self, path: str, file_patterns: str, min_comment_length: int):
        self.path = path
        self.file_patterns = [pattern.strip() for pattern in file_patterns.split(',')]
        self.min_comment_length = min_comment_length
        self.issues = []

    def find_files(self) -> List[str]:
        """Find all files matching the specified patterns."""
        files = []
        for pattern in self.file_patterns:
            files.extend(glob.glob(os.path.join(self.path, '**', pattern), recursive=True))
        return files

    def extract_content(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract content from a file based on its extension."""
        ext = os.path.splitext(file_path)[1].lower()
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if ext == '.md':
            # For markdown files, we'll analyze the entire content
            return [{
                'text': content,
                'line': 1,
                'file': file_path,
                'type': 'markdown'
            }]
        else:
            # For code files, extract comments
            return self.extract_comments(file_path, content)

    def extract_comments(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        """Extract comments from a file based on its extension."""
        comments = []
        ext = os.path.splitext(file_path)[1].lower()
        
        # Basic comment patterns for different file types
        patterns = {
            '.py': r'#.*$|"""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\'',
            '.js': r'//.*$|/\*[\s\S]*?\*/',
            '.ts': r'//.*$|/\*[\s\S]*?\*/',
            '.java': r'//.*$|/\*[\s\S]*?\*/',
            '.cpp': r'//.*$|/\*[\s\S]*?\*/',
            '.h': r'//.*$|/\*[\s\S]*?\*/'
        }
        
        if ext in patterns:
            for match in re.finditer(patterns[ext], content, re.MULTILINE):
                comment = match.group(0).strip()
                if len(comment) >= self.min_comment_length:
                    comments.append({
                        'text': comment,
                        'line': content[:match.start()].count('\n') + 1,
                        'file': file_path,
                        'type': 'comment'
                    })
        
        return comments

    def analyze_content(self, content_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze content for potential issues."""
        issues = []
        for item in content_items:
            # Check for GitHub capitalization
            if 'github' in item['text'].lower():
                matches = re.finditer(r'github', item['text'], re.IGNORECASE)
                for match in matches:
                    issues.append({
                        'type': 'github_capitalization',
                        'message': 'Found "github" that should be capitalized as "GitHub"',
                        'file': item['file'],
                        'line': item['line'],
                        'original_text': item['text'],
                        'start_pos': match.start(),
                        'end_pos': match.end()
                    })

            # Additional checks for markdown files
            if item['type'] == 'markdown':
                # Check for broken links
                link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
                for match in re.finditer(link_pattern, item['text']):
                    link_text, link_url = match.groups()
                    if link_url.startswith('http') and not link_url.startswith('https'):
                        issues.append({
                            'type': 'insecure_link',
                            'message': 'Found HTTP link that should be HTTPS',
                            'file': item['file'],
                            'line': item['text'][:match.start()].count('\n') + 1,
                            'original_text': match.group(0),
                            'start_pos': match.start(),
                            'end_pos': match.end()
                        })

                # Check for missing alt text in images
                img_pattern = r'!\[([^\]]*)\]\(([^)]+)\)'
                for match in re.finditer(img_pattern, item['text']):
                    alt_text, img_url = match.groups()
                    if not alt_text.strip():
                        issues.append({
                            'type': 'missing_alt_text',
                            'message': 'Image is missing alt text',
                            'file': item['file'],
                            'line': item['text'][:match.start()].count('\n') + 1,
                            'original_text': match.group(0),
                            'start_pos': match.start(),
                            'end_pos': match.end()
                        })

                # Check for inconsistent heading levels
                heading_pattern = r'^(#{1,6})\s+(.+)$'
                last_level = 0
                for line_num, line in enumerate(item['text'].split('\n'), 1):
                    heading_match = re.match(heading_pattern, line)
                    if heading_match:
                        current_level = len(heading_match.group(1))
                        if current_level - last_level > 1 and last_level != 0:
                            issues.append({
                                'type': 'heading_skip',
                                'message': f'Skipped heading level (from h{last_level} to h{current_level})',
                                'file': item['file'],
                                'line': line_num,
                                'original_text': line,
                                'start_pos': 0,
                                'end_pos': len(line)
                            })
                        last_level = current_level

        return issues

    def generate_report(self, issues: List[Dict[str, Any]]) -> str:
        """Generate a YAML report of the issues found."""
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_issues': len(issues),
            'issues': issues
        }
        
        report_path = os.path.join(self.path, 'prose_audit_report.yaml')
        with open(report_path, 'w') as f:
            yaml.dump(report, f, default_flow_style=False)
        
        return report_path

    def run_audit(self) -> None:
        """Run the complete audit process."""
        files = self.find_files()
        all_content = []
        
        for file_path in files:
            content_items = self.extract_content(file_path)
            all_content.extend(content_items)
        
        issues = self.analyze_content(all_content)
        report_path = self.generate_report(issues)
        
        # Set GitHub Action outputs
        print(f"::set-output name=issues_found::{len(issues)}")
        print(f"::set-output name=report_path::{report_path}")

def main():
    # Get inputs from GitHub Actions
    path = os.getenv('INPUT_PATH', '.')
    file_patterns = os.getenv('INPUT_FILE_PATTERNS', '*.py,*.js,*.ts,*.java,*.cpp,*.h,*.md')
    min_comment_length = int(os.getenv('INPUT_MIN_COMMENT_LENGTH', '10'))
    
    auditor = ProseAuditor(path, file_patterns, min_comment_length)
    auditor.run_audit()

if __name__ == '__main__':
    main()