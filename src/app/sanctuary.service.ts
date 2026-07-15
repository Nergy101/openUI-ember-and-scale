import { Injectable } from '@angular/core';
import type { ChatMessage, ToolSpec } from './models';

/** Talks to the Ember & Scale backend: tool specs + streaming chat. */
@Injectable({ providedIn: 'root' })
export class SanctuaryService {
  async fetchToolSpecs(): Promise<ToolSpec[]> {
    const res = await fetch('/api/tools/spec');
    if (!res.ok) throw new Error(`Failed to load tool specs (${res.status})`);
    const body: unknown = await res.json();
    if (!body || typeof body !== 'object' || !('tools' in body)) return [];
    const tools = body.tools;
    if (!Array.isArray(tools)) return [];
    return tools.filter(
      (t): t is ToolSpec =>
        !!t && typeof t === 'object' && 'name' in t && typeof t.name === 'string',
    );
  }

  /**
   * POST the conversation and stream the OpenUI-Lang response back.
   * `onDelta` receives the full accumulated text so far on every chunk.
   */
  async streamChat(
    systemPrompt: string,
    messages: ChatMessage[],
    onDelta: (accumulated: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, messages }),
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`Chat request failed (${res.status})`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      onDelta(acc);
    }
    acc += decoder.decode();
    onDelta(acc);
  }
}
