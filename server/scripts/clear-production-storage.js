/**
 * Clear all Book2Door storage buckets (production reset).
 * Run from server folder: npm run clear-storage
 */
import dotenv from 'dotenv';
import { emptyAllStorageBuckets } from '../utils/storageManager.js';

dotenv.config();

async function main() {
  console.log('Clearing storage buckets...\n');
  const results = await emptyAllStorageBuckets();

  for (const { bucket, deleted } of results) {
    console.log(`  ${bucket}: ${deleted} file(s) deleted`);
  }

  const total = results.reduce((sum, r) => sum + r.deleted, 0);
  console.log(`\nDone. ${total} file(s) removed total.`);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
