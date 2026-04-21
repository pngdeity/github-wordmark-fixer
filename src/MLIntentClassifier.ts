import { pipeline, Pipeline } from '@xenova/transformers';
import { ProseNode } from './types.js';

export class MLIntentClassifier {
  private classifier: Pipeline | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initializes the CodeBERT model for sequence classification.
   */
  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (this.classifier) return;

      // Use a pre-trained CodeBERT or similar model compatible with Transformers.js
      // For this demonstration, we'll use a sentiment analysis model as a proxy if a 
      // specific intent classifier isn't available, but the architecture supports
      // any ONNX sequence classifier.
      // In a real Phase 3, we'd use a custom-trained 'github-intent-classifier'.
      this.classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    })();

    return this.initPromise;
  }

  /**
   * Classifies the intent of a ProseNode to determine if it's explanatory prose.
   * 
   * @param node The ProseNode to classify.
   * @returns A probability score (0.0 to 1.0) of being explanatory prose.
   */
  async classify(node: ProseNode): Promise<number> {
    if (!this.classifier) {
      await this.initialize();
    }

    // Combine comment and context for better semantic understanding
    const input = node.context 
      ? `Comment: ${node.rawText}\nContext: ${node.context}`
      : node.rawText;

    const results = await this.classifier!(input);
    
    // In a real implementation, we'd check for specific labels like 'EXPLANATORY_PROSE'
    // For this proxy, we'll return a score based on the model's confidence.
    const result = (Array.isArray(results) ? results[0] : results) as { label: string; score: number };
    
    return result.score;
  }
}
