/**
 * Local Claude CLI provider.
 *
 * Shells out to the `claude` binary (Claude Code) in non-interactive print mode
 * and streams its output back as OpenUI-Lang. The OpenUI system prompt (built in
 * the browser, incl. the sanctuary tools) is passed via --system-prompt-file so
 * it OVERRIDES Claude Code's default agentic prompt — turning the CLI into a pure
 * OpenUI-Lang generator. Auth is whatever the CLI already uses (OAuth login,
 * keychain, or ANTHROPIC_API_KEY); this provider adds none.
 *
 * Requires the user to be logged in: `claude login` (or set ANTHROPIC_API_KEY).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ChatMessage } from './llm.js';

/** Flatten the conversation into a single prompt (system is passed separately). */
function buildPrompt(messages: ChatMessage[]): string {
  const convo = messages.filter((m) => m.role !== 'system');
  if (convo.length <= 1) return convo[0]?.content ?? '';
  const prior = convo
    .slice(0, -1)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant (previous UI)'}: ${m.content}`)
    .join('\n\n');
  const latest = convo[convo.length - 1]!.content;
  return `Conversation so far:\n${prior}\n\nRespond to the latest request:\n${latest}`;
}

/** Extract an incremental text delta from a stream-json event, if present. */
function textDelta(evt: unknown): string | null {
  if (!evt || typeof evt !== 'object' || !('type' in evt) || evt.type !== 'stream_event') return null;
  if (!('event' in evt)) return null;
  const event = evt.event;
  if (!event || typeof event !== 'object' || !('type' in event)) return null;
  if (event.type !== 'content_block_delta' || !('delta' in event)) return null;
  const delta = event.delta;
  if (!delta || typeof delta !== 'object' || !('type' in delta)) return null;
  if (delta.type !== 'text_delta' || !('text' in delta) || typeof delta.text !== 'string') return null;
  return delta.text;
}

/** Read the terminal `result` event (final text + error flag). */
function resultInfo(evt: unknown): { isError: boolean; text: string } | null {
  if (!evt || typeof evt !== 'object' || !('type' in evt) || evt.type !== 'result') return null;
  const isError = 'is_error' in evt && evt.is_error === true;
  const text = 'result' in evt && typeof evt.result === 'string' ? evt.result : '';
  return { isError, text };
}

export async function streamClaude(
  systemPrompt: string,
  messages: ChatMessage[],
  onDelta: (s: string) => void,
): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'emberscale-'));
  const systemPromptFile = join(dir, 'system-prompt.txt');
  writeFileSync(systemPromptFile, systemPrompt, 'utf8');

  const model = process.env.CLAUDE_MODEL ?? 'sonnet';
  const args = [
    '-p',
    '--output-format',
    'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--system-prompt-file',
    systemPromptFile,
    '--model',
    model,
  ];

  // Run outside the repo so Claude doesn't auto-discover CLAUDE.md / project context.
  const child = spawn('claude', args, { cwd: tmpdir(), env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdin?.write(buildPrompt(messages));
  child.stdin?.end();

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  let buffer = '';
  let sawDelta = false;
  let resultText = '';
  let resultIsError = false;
  let stderr = '';

  const handleLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let evt: unknown;
    try {
      evt = JSON.parse(trimmed);
    } catch {
      return;
    }
    const delta = textDelta(evt);
    if (delta) {
      sawDelta = true;
      onDelta(delta);
      return;
    }
    const result = resultInfo(evt);
    if (result) {
      resultIsError = result.isError;
      resultText = result.text;
    }
  };

  child.stdout?.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    let idx = buffer.indexOf('\n');
    while (idx >= 0) {
      handleLine(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 1);
      idx = buffer.indexOf('\n');
    }
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });
  child.on('error', (err) => {
    reject(new Error(`Failed to run claude CLI (is it installed and on PATH?): ${err.message}`));
  });
  child.on('close', (code) => {
    if (buffer.trim()) handleLine(buffer);
    if (resultIsError) {
      reject(new Error(resultText || 'claude CLI reported an error'));
      return;
    }
    // No incremental deltas (e.g. --include-partial-messages unsupported): emit the final result once.
    if (!sawDelta && resultText) onDelta(resultText);
    if (!sawDelta && !resultText && code !== 0) {
      reject(new Error(stderr.trim() || `claude CLI exited with code ${code}`));
      return;
    }
    resolve();
  });

  try {
    await promise;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
