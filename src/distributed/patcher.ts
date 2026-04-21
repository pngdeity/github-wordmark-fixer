import './instrumentation.js';
import amqp from 'amqplib';
import { promises as fs } from 'node:fs';
import { MutationCalculatedEvent } from './events.js';
import { FilePatcher } from '../FilePatcher.js';

async function runPatcher() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  const channel = await connection.createChannel();
  
  const queue = 'mutation_calculated';
  await channel.assertQueue(queue, { durable: true });
  channel.prefetch(1);

  const patcher = new FilePatcher();

  console.log('[Patcher] Waiting for mutations...');

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const event: MutationCalculatedEvent = JSON.parse(msg.content.toString());
    console.log(`[Patcher] Patching: ${event.filePath}`);

    try {
      const rawCode = await fs.readFile(event.filePath, 'utf-8');
      const patchedCode = patcher.patch(rawCode, event.proposals);
      
      await fs.writeFile(event.filePath, patchedCode, 'utf-8');
      console.log(`[Patcher] Successfully patched ${event.filePath}`);

      channel.ack(msg);
    } catch (err) {
      console.error(`[Patcher] Error patching ${event.filePath}:`, err);
      // Disable requeue (3rd param false) to prevent infinite poison-message loops
      channel.nack(msg, false, false);
    }
  });
}

runPatcher().catch(console.error);
