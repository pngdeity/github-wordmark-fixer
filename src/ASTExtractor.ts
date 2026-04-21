import Parser from 'tree-sitter';
import ts from 'tree-sitter-typescript';
import { ProseNode } from './types.js';

export class ASTExtractor {
  private parser: Parser;
  private query: Parser.Query;

  constructor() {
    this.parser = new Parser();
    // Use the TS parser. tree-sitter-typescript exports { typescript, tsx }
    const language = ts.typescript;
    this.parser.setLanguage(language);
    
    // We want to extract comments
    this.query = new Parser.Query(language, '(comment) @comment');
  }

  /**
   * Parses the raw code and extracts ProseNodes containing comments.
   * 
   * @param rawCode The complete source code of a file.
   * @param filePath The path of the file being parsed.
   * @returns An array of ProseNodes.
   */
  extract(rawCode: string, filePath: string): ProseNode[] {
    const tree = this.parser.parse(rawCode);
    const matches = this.query.matches(tree.rootNode);

    const nodes: ProseNode[] = [];

    for (const match of matches) {
      for (const capture of match.captures) {
        if (capture.name === 'comment') {
          // Capture the text of the next sibling as context
          const contextNode = capture.node.nextSibling;
          const context = contextNode ? contextNode.text : undefined;

          nodes.push({
            filePath,
            rawText: capture.node.text,
            context,
            globalStartIndex: capture.node.startIndex,
            globalEndIndex: capture.node.endIndex,
            maskedRegions: []
          });
        }
      }
    }

    return nodes;
  }
}
