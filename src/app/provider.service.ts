import { Injectable, signal } from '@angular/core';

export type AiProvider = 'claude' | 'copilot' | 'ollama';

export interface ProviderOption {
  id: AiProvider;
  label: string;
  hint: string;
}

const STORAGE_KEY = 'ember-scale.provider';

/** Which local CLI/model backs the chat. Selected in the topbar, sent on every
 *  `/api/chat` request — the server's LLM_PROVIDER env var is only a fallback
 *  default for callers that skip the selector entirely. */
@Injectable({ providedIn: 'root' })
export class ProviderService {
  readonly options: ProviderOption[] = [
    { id: 'claude', label: 'Claude CLI', hint: 'claude — default' },
    { id: 'copilot', label: 'Copilot CLI', hint: 'GitHub Copilot CLI' },
    { id: 'ollama', label: 'Ollama (local)', hint: 'gemma4:12b via ollama' },
  ];

  readonly selected = signal<AiProvider>(this.restore());

  select(id: AiProvider): void {
    this.selected.set(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // private browsing / storage disabled — selection just won't persist
    }
  }

  private restore(): AiProvider {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'claude' || stored === 'copilot' || stored === 'ollama') return stored;
    } catch {
      // ignore
    }
    return 'claude';
  }
}
