import { Injectable, signal } from '@angular/core';
import type { IslandApi, ToolSpec } from './models';

/**
 * Thin bridge to the OpenUI React island loaded via <script> in index.html.
 * The island attaches `window.OpenUIIsland`; this service waits for it and
 * proxies the imperative render API to Angular components.
 */
@Injectable({ providedIn: 'root' })
export class OpenUiService {
  readonly ready = signal(false);
  private readyResolvers: Array<() => void> = [];

  constructor() {
    this.injectIslandAssets();
    this.pollForIsland();
  }

  /** Load the OpenUI React island bundle (js + css) shipped as public assets. */
  private injectIslandAssets(): void {
    if (document.getElementById('openui-island-js')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'openui-island.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.id = 'openui-island-js';
    script.src = 'openui-island.js';
    script.defer = true;
    document.head.appendChild(script);
  }

  private pollForIsland(): void {
    if (window.OpenUIIsland) {
      this.ready.set(true);
      for (const r of this.readyResolvers) r();
      this.readyResolvers = [];
      return;
    }
    setTimeout(() => this.pollForIsland(), 50);
  }

  whenReady(): Promise<void> {
    if (this.ready()) return Promise.resolve();
    const { promise, resolve } = Promise.withResolvers<void>();
    this.readyResolvers.push(resolve);
    return promise;
  }

  private get island(): IslandApi | undefined {
    return window.OpenUIIsland;
  }

  buildSystemPrompt(specs: ToolSpec[]): string {
    const island = this.island;
    if (!island) throw new Error('OpenUI island not loaded yet.');
    return island.buildSystemPrompt(specs);
  }

  render(el: HTMLElement, response: string | null, isStreaming: boolean): void {
    this.island?.render(el, { response, isStreaming });
  }

  unmount(el: HTMLElement): void {
    this.island?.unmount(el);
  }
}
