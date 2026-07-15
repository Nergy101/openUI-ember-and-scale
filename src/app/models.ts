/** Shared client types + the OpenUI island global contract. */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Mirrors the backend ToolSpec shipped from /api/tools/spec. */
export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

/** A single turn in the conversation thread. */
export interface Turn {
  id: string;
  role: 'user' | 'assistant';
  /** User text, or the assistant's OpenUI-Lang code (rendered, not shown as text). */
  text: string;
  streaming: boolean;
}

/** Imperative API exposed by island/index.tsx (bundled to public/openui-island.js). */
export interface IslandApi {
  buildSystemPrompt(specs: ToolSpec[]): string;
  render(el: HTMLElement, props: { response: string | null; isStreaming: boolean }): void;
  unmount(el: HTMLElement): void;
}

declare global {
  interface Window {
    OpenUIIsland?: IslandApi;
  }
}
