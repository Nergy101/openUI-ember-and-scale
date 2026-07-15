import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GenuiComponent } from './genui.component';
import { OpenUiService } from './openui.service';
import { SanctuaryService } from './sanctuary.service';
import type { ChatMessage, Turn } from './models';

interface Example {
  emoji: string;
  label: string;
  prompt: string;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule, GenuiComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  private readonly sanctuary = inject(SanctuaryService);
  private readonly openui = inject(OpenUiService);

  readonly turns = signal<Turn[]>([]);
  readonly draft = signal('');
  readonly busy = signal(false);

  private systemPrompt: string | null = null;

  readonly examples: Example[] = [
    { emoji: '🔥', label: 'Fire dragons', prompt: 'Show me the fire dragons as profile cards' },
    { emoji: '💰', label: 'Treasure by element', prompt: 'Which element hoards the most treasure? Chart it' },
    { emoji: '📊', label: 'Sanctuary dashboard', prompt: 'Build me a sanctuary dashboard' },
    { emoji: '🗓️', label: 'Rescues report', prompt: 'Give me a report of rescues across the seasons' },
    { emoji: '🏆', label: 'Most powerful', prompt: 'Who are the most powerful dragons? Let me sponsor one' },
    { emoji: '⚔️', label: 'Ice vs. Fire', prompt: 'Compare ice dragons and fire dragons head to head' },
    { emoji: '⚡', label: 'Storm chasers', prompt: 'Tell me about our storm dragons — how wild are they?' },
    { emoji: '💎', label: 'Richest hoard', prompt: 'Which single dragon has the biggest treasure hoard?' },
    { emoji: '😈', label: 'Chaotic energy', prompt: 'Show me our most chaotic and mischievous dragons' },
    { emoji: '🎲', label: 'Surprise me', prompt: 'Surprise me with something fun about the sanctuary' },
    { emoji: '✏️', label: 'Edit a dragon', prompt: "Let me pick a dragon and edit its name, temperament, and status" },
    { emoji: '🎛️', label: 'Live filters', prompt: 'Give me interactive filters to browse dragons live by element and status' },
  ];

  useExample(prompt: string): void {
    this.send(prompt);
  }

  submit(): void {
    this.send(this.draft());
  }

  private async ensureSystemPrompt(): Promise<string> {
    if (this.systemPrompt) return this.systemPrompt;
    await this.openui.whenReady();
    const specs = await this.sanctuary.fetchToolSpecs();
    this.systemPrompt = this.openui.buildSystemPrompt(specs);
    return this.systemPrompt;
  }

  private updateLastTurn(mutate: (turn: Turn) => Turn): void {
    this.turns.update((list) => {
      if (list.length === 0) return list;
      const next = list.slice();
      next[next.length - 1] = mutate(next[next.length - 1]);
      return next;
    });
  }

  async send(text: string): Promise<void> {
    const content = text.trim();
    if (!content || this.busy()) return;

    this.draft.set('');
    this.busy.set(true);

    const history: ChatMessage[] = this.turns().map((t) => ({ role: t.role, content: t.text }));
    history.push({ role: 'user', content });

    const userTurn: Turn = { id: crypto.randomUUID(), role: 'user', text: content, streaming: false };
    const assistantTurn: Turn = { id: crypto.randomUUID(), role: 'assistant', text: '', streaming: true };
    this.turns.update((list) => [...list, userTurn, assistantTurn]);

    try {
      const systemPrompt = await this.ensureSystemPrompt();
      await this.sanctuary.streamChat(systemPrompt, history, (acc) => {
        this.updateLastTurn((t) => ({ ...t, text: acc }));
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const code = `err = Callout("error", "Something went wrong", ${JSON.stringify(message)})\nroot = Stack([err])`;
      this.updateLastTurn((t) => ({ ...t, text: code }));
    } finally {
      this.updateLastTurn((t) => ({ ...t, streaming: false }));
      this.busy.set(false);
    }
  }
}
