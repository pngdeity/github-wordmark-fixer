import './instrumentation.js';
import amqp from 'amqplib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileDiscoveredEvent } from './events.js';

async function runTriager() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  const channel = await connection.createChannel();
  
  const queue = 'file_discovered';
  await channel.assertQueue(queue, { durable: true });

  const repoPath = process.env.REPO_PATH || './';
  
  async function scanDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        await scanDirectory(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.md')) {
        const event: FileDiscoveredEvent = {
          filePath: fullPath,
          repoPath: path.resolve(repoPath)
        };
        
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(event)), {
          persistent: true
        });
        console.log(`[Triager] Published: ${fullPath}`);
      }
    }
  }

  console.log(`[Triager] Starting scan in: ${repoPath}`);
  await scanDirectory(repoPath);
  
  // Keep alive for metrics if needed, or close
  setTimeout(async () => {
    await channel.close();
    await connection.close();
    process.exit(0);
  }, 5000);
}

runTriager().catch(console.error);
