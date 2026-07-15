/**
 * OpenUI "island" — a tiny React root the Angular shell drives imperatively.
 *
 * Angular owns the whole application (chat, layout, services, state). The one
 * thing it cannot do natively is run OpenUI's React renderer, so we bundle it
 * here as a standalone IIFE and expose a small imperative API on
 * `window.OpenUIIsland`. This is the honest way to use OpenUI (a React runtime)
 * inside Angular without reimplementing its parser/runtime.
 *
 * Built by island/build.mjs into web-served assets:
 *   public/openui-island.js   (this module, IIFE, global: OpenUIIsland)
 *   public/openui-island.css  (react-ui styles, concatenated)
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { Renderer } from '@openuidev/react-lang';
import type { OpenUIError } from '@openuidev/react-lang';
import type { PromptOptions, ToolSpec } from '@openuidev/lang-core';
import { openuiLibrary, openuiPromptOptions } from '@openuidev/react-ui/genui-lib';

// ── System prompt ─────────────────────────────────────────────────────────────
const PREAMBLE = [
  'You are the interface for "Ember & Scale", a whimsical dragon rescue sanctuary.',
  'When the user asks about dragons, hoards, rescues or sanctuary stats, generate a',
  'purpose-built UI (cards, tables, charts, KPIs, small reports) using the components',
  'and the sanctuary tools below. Prefer Query() so data streams live. Keep it playful.',
  '',
  'OUTPUT FORMAT — this is a hard requirement, not a style preference:',
  'Respond with ONE fenced code block (```...```) containing ONLY the OpenUI-Lang',
  'program, and nothing else. No greeting, no narration of what you are about to do,',
  'no explanation, no summary, and no follow-up question outside the fence — the',
  'fence contents are parsed directly and any stray text breaks the UI for the user.',
  'Think the whole program through before writing the first character. If you spot a',
  'mistake in something you already wrote, do NOT explain the mistake or apologize —',
  'just open a new fenced code block with the corrected program; only the LAST fenced',
  'block you output will ever be shown, so never leave a broken draft as the final one.',
].join(' ');

/** Pull the content of the last fenced code block out of raw model text, if any.
 *  Tolerates an unterminated trailing fence (still streaming). Falls back to the
 *  raw text untouched when no fence is present, so non-fencing providers (mock,
 *  plain OpenAI/Azure completions) keep working exactly as before. */
export function extractProgram(text: string): string {
  // Splitting on every ``` fence marker (open or close alike) alternates the
  // resulting segments in/out of a fence, starting outside. So odd indices are
  // always fence contents; the last one — complete or still streaming — wins.
  const parts = text.split(/```[^\n]*\n?/);
  const lastInsideIdx = parts.length % 2 === 0 ? parts.length - 1 : parts.length - 2;
  return lastInsideIdx >= 1 ? parts[lastInsideIdx]! : text;
}

let toolNames: string[] = [];

export function buildSystemPrompt(toolSpecs: ToolSpec[]): string {
  toolNames = toolSpecs.map((t) => t.name);
  const options: PromptOptions = {
    ...openuiPromptOptions,
    preamble: PREAMBLE,
    tools: toolSpecs,
    toolCalls: true,
    bindings: true,
  };
  return openuiLibrary.prompt(options);
}

// ── Tool provider ─────────────────────────────────────────────────────────────
// A concrete function map (NOT a Proxy): a Proxy would answer `callTool`, and the
// renderer would then misidentify it as an MCP client. Every Query()/Mutation()
// the generated UI runs is routed to the backend by tool name.
type ToolFn = (args: Record<string, unknown>) => Promise<unknown>;

function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  return fetch(`/api/tools/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args ?? {}),
  }).then((res) => {
    if (!res.ok) throw new Error(`Tool "${name}" failed (${res.status})`);
    return res.json();
  });
}

function makeToolProvider(): Record<string, ToolFn> {
  const map: Record<string, ToolFn> = {};
  for (const name of toolNames) {
    map[name] = (args: Record<string, unknown>) => callTool(name, args);
  }
  return map;
}

// ── Imperative render API ─────────────────────────────────────────────────────
export interface RenderProps {
  response: string | null;
  isStreaming: boolean;
}

const roots = new WeakMap<HTMLElement, Root>();

function onError(errors: OpenUIError[]): void {
  if (errors.length > 0) console.warn('[OpenUIIsland] parse/runtime errors:', errors);
}

export function render(el: HTMLElement, props: RenderProps): void {
  let root = roots.get(el);
  if (!root) {
    root = createRoot(el);
    roots.set(el, root);
  }
  const response = props.response === null ? null : extractProgram(props.response);
  root.render(
    React.createElement(Renderer, {
      response,
      library: openuiLibrary,
      isStreaming: props.isStreaming,
      toolProvider: makeToolProvider(),
      onError,
    }),
  );
}

export function unmount(el: HTMLElement): void {
  const root = roots.get(el);
  if (root) {
    root.unmount();
    roots.delete(el);
  }
}
