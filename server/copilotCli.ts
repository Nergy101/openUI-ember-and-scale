/**
 * Local GitHub Copilot CLI provider.
 *
 * Shells out to the `copilot` binary (GitHub's agentic coding CLI, installed
 * standalone or via `gh copilot` — see https://gh.io/copilot-cli) in
 * non-interactive mode and streams its stdout back as OpenUI-Lang.
 *
 * ⚠️ UNVERIFIED: unlike claudeCli.ts (tested end-to-end against the real
 * `claude` binary), this module was written from documented/recalled CLI
 * shape rather than a local install — `copilot` was not present on this
 * machine to test against. The flags below (`-p`, `--allow-all-tools`) are
 * the best-effort non-interactive/permission-bypass equivalents of Claude
 * Code's `-p`/`--dangerously-skip-permissions`; confirm against `copilot
 * --help` and adjust before relying on this in anger. Unlike claudeCli.ts,
 * this treats stdout as plain text (no stream-json event parsing) since the
 * exact structured-output format wasn't confirmed either — if `copilot`
 * supports a JSON stream mode, switching to it would give truer incremental
 * deltas instead of chunking the final text client-side.
 *
 * Requires the user to already be authenticated with the CLI (`copilot` login
 * flow); this provider adds no credentials of its own.
 */
import { spawn } from 'node:child_process';
import type { ChatMessage } from './llm.js';

function buildPrompt(systemPrompt: string, messages: ChatMessage[]): string {
  const convo = messages.filter((m) => m.role !== 'system');
  const prior = convo
    .slice(0, -1)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant (previous UI)'}: ${m.content}`)
    .join('\n\n');
  const latest = convo[convo.length - 1]?.content ?? '';
  const parts = [systemPrompt];
  if (prior) parts.push(`Conversation so far:\n${prior}`);
  parts.push(`Respond to the latest request:\n${latest}`);
  return parts.join('\n\n');
}

export async function streamCopilot(
  systemPrompt: string,
  messages: ChatMessage[],
  onDelta: (s: string) => void,
): Promise<void> {
  const prompt = buildPrompt(systemPrompt, messages);
  const model = process.env.COPILOT_MODEL;
  const args = ['-p', prompt, '--allow-all-tools', ...(model ? ['--model', model] : [])];

  const child = spawn('copilot', args, { cwd: process.cwd(), env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  let sawOutput = false;
  let stderr = '';

  child.stdout?.on('data', (chunk: Buffer) => {
    sawOutput = true;
    onDelta(chunk.toString('utf8'));
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });
  child.on('error', (err) => {
    reject(new Error(`Failed to run copilot CLI (is it installed and on PATH? see https://gh.io/copilot-cli): ${err.message}`));
  });
  child.on('close', (code) => {
    if (!sawOutput && code !== 0) {
      reject(new Error(stderr.trim() || `copilot CLI exited with code ${code}`));
      return;
    }
    resolve();
  });

  await promise;
}
