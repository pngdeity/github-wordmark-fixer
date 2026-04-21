import './instrumentation.js';
import amqp from 'amqplib';
import { promises as fs } from 'node:fs';
import { FileDiscoveredEvent, MutationCalculatedEvent } from './events.js';
import { ASTExtractor } from '../ASTExtractor.js';
import { HeuristicMasker } from '../HeuristicMasker.js';
import { AuditController } from '../AuditController.js';
import { CorrectionEngine } from '../CorrectionEngine.js';
import { CorpusTokenizer } from '../CorpusTokenizer.js';
import { CandidateFilter } from '../CandidateFilter.js';
import { WeightedDistanceCalculator } from '../WeightedDistanceCalculator.js';
import { MLIntentClassifier } from '../MLIntentClassifier.js';

async function runWorker() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  const channel = await connection.createChannel();
  
  const inQueue = 'file_discovered';
  const outQueue = 'mutation_calculated';
  
  await channel.assertQueue(inQueue, { durable: true });
  await channel.assertQueue(outQueue, { durable: true });
  channel.prefetch(1);

  const extractor = new ASTExtractor();
  const masker = new HeuristicMasker();
  const classifier = new MLIntentClassifier();
  await classifier.initialize();

  const tokenizer = new CorpusTokenizer();
  const filter = new CandidateFilter();
  const calculator = new WeightedDistanceCalculator();
  const engine = new CorrectionEngine(tokenizer, filter, calculator);
  const auditor = new AuditController(engine);

  const weights = {
    insertion: 1.0,
    deletion: 1.0,
    substitution: 1.0,
    caseMismatch: 0.1,
    transposition: 0.5
  };

  console.log('[Worker] Waiting for files...');

  channel.consume(inQueue, async (msg) => {
    if (!msg) return;

    const event: FileDiscoveredEvent = JSON.parse(msg.content.toString());
    console.log(`[Worker] Processing: ${event.filePath}`);

    try {
      const rawCode = await fs.readFile(event.filePath, 'utf-8');
      const nodes = extractor.extract(rawCode, event.filePath);
      const allProposals = [];

      for (const node of nodes) {
        const intentScore = await classifier.classify(node);
        if (intentScore < 0.90) continue;

        const maskedNode = masker.mask(node);
        const proposals = auditor.audit(maskedNode, 'GitHub', 0.5, weights);
        allProposals.push(...proposals);
      }

      if (allProposals.length > 0) {
        const outEvent: MutationCalculatedEvent = {
          filePath: event.filePath,
          proposals: allProposals
        };
        channel.sendToQueue(outQueue, Buffer.from(JSON.stringify(outEvent)), {
          persistent: true
        });
        console.log(`[Worker] Found ${allProposals.length} issues in ${event.filePath}`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error(`[Worker] Error processing ${event.filePath}:`, err);
      // Disable requeue (3rd param false) to prevent infinite poison-message loops
      channel.nack(msg, false, false); 
    }
  });
}

runWorker().catch(console.error);
