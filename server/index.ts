/**
 * Ember & Scale demo backend.
 *
 *   GET  /api/health          — provider + status
 *   GET  /api/tools/spec      — tool specs (browser bakes these into the prompt)
 *   POST /api/tools/:name     — execute a sanctuary tool (Query/Mutation target)
 *   POST /api/chat            — stream OpenUI-Lang from the configured LLM
 *
 * In production it also static-serves the built Angular app.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod/v4';
import { runTool, toolSpecs } from './data.js';
import { activeProvider, streamChat } from './llm.js';

const PORT = Number(process.env.PORT ?? 8787);

const chatBodySchema = z.object({
  systemPrompt: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    }),
  ),
  // Per-request provider from the chat UI's selector. Falls back to the
  // server's LLM_PROVIDER env default (activeProvider()) when omitted.
  provider: z.enum(['mock', 'claude', 'copilot', 'ollama', 'openai', 'azure']).optional(),
});

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, provider: activeProvider(), tools: toolSpecs.map((t) => t.name) });
});

app.get('/api/tools/spec', (_req: Request, res: Response) => {
  res.json({ tools: toolSpecs });
});

app.post('/api/tools/:name', (req: Request, res: Response) => {
  const name = String(req.params.name);
  const args = z.record(z.string(), z.unknown()).catch({}).parse(req.body);
  try {
    res.json(runTool(name, args));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown tool error';
    res.status(400).json({ error: message });
  }
});

app.post('/api/chat', async (req: Request, res: Response) => {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid chat request', details: parsed.error.issues });
    return;
  }
  const { systemPrompt, messages, provider } = parsed.data;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    await streamChat(
      systemPrompt,
      messages,
      (delta) => {
        res.write(delta);
      },
      provider,
    );
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown LLM error';
    // Keep the response a 200 stream and surface the error in-band as OpenUI-Lang,
    // so the client renders the real message (e.g. "run `claude login`") as a Callout.
    res.write(
      `\nerr = Callout("error", "LLM unavailable", ${JSON.stringify(message)})\nroot = Stack([err])`,
    );
    res.end();
  }
});

// ── Production: serve the built Angular app ───────────────────────────────────
const browserDir = join(process.cwd(), 'dist', 'ember-scale', 'browser');
if (existsSync(browserDir)) {
  app.use(express.static(browserDir));
  app.get(/^(?!\/api\/).*/, (_req: Request, res: Response) => {
    res.sendFile(join(browserDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[ember-scale] backend on http://localhost:${PORT}  (provider: ${activeProvider()})`);
});
