// Preview the site locally: node scripts/serve.mjs [port]
import { serve } from './lib.mjs';
const s = await serve(undefined, Number(process.argv[2] || 8080));
console.log(`Project Lab running at ${s.url} (Ctrl+C to stop)`);
