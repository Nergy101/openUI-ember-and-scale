/**
 * LLM provider abstraction for the chat backend.
 *
 *   LLM_PROVIDER=claude   (default) — the local Claude CLI (`claude`)
 *   LLM_PROVIDER=copilot            — the local GitHub Copilot CLI (`copilot`)
 *   LLM_PROVIDER=ollama             — a local Ollama model (OLLAMA_MODEL, default gemma4:12b)
 *   LLM_PROVIDER=openai             — OpenAI or any OpenAI-compatible endpoint
 *   LLM_PROVIDER=azure              — Azure OpenAI, via API key OR a locally
 *                                     logged-in identity (DefaultAzureCredential)
 *   LLM_PROVIDER=mock               — offline canned OpenUI-Lang streamer
 *
 * This env var is only the server-startup DEFAULT. The chat UI's provider
 * selector sends the chosen provider on every request (see `streamChat`'s
 * `providerOverride` param) — normal use never falls back to the env value.
 *
 * All providers stream plain OpenUI-Lang text back to the caller one delta at
 * a time via the `onDelta` callback.
 */
import OpenAI, { AzureOpenAI } from 'openai';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { streamClaude } from './claudeCli.js';
import { streamCopilot } from './copilotCli.js';
import { pickMockResponse } from './mockResponses.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type Provider = 'mock' | 'claude' | 'copilot' | 'ollama' | 'openai' | 'azure';

export function activeProvider(): Provider {
  const p = (process.env.LLM_PROVIDER ?? 'claude').toLowerCase();
  if (p === 'mock') return 'mock';
  if (p === 'copilot') return 'copilot';
  if (p === 'ollama') return 'ollama';
  if (p === 'openai' || p === 'local') return 'openai';
  if (p === 'azure') return 'azure';
  return 'claude';
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

function lastUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') return messages[i]!.content;
  }
  return '';
}

async function streamMock(messages: ChatMessage[], onDelta: (s: string) => void): Promise<void> {
  const code = pickMockResponse(lastUserMessage(messages));
  // Stream in small chunks to exercise the real progressive parser.
  const CHUNK = 18;
  for (let i = 0; i < code.length; i += CHUNK) {
    onDelta(code.slice(i, i + CHUNK));
    await delay(35);
  }
}

function makeOpenAIClient(): { client: OpenAI; model: string } {
  const apiKey = process.env.OPENAI_API_KEY ?? 'not-needed-for-local';
  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const client = new OpenAI({ apiKey, baseURL });
  return { client, model };
}

function makeOllamaClient(): { client: OpenAI; model: string } {
  const baseURL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1';
  const model = process.env.OLLAMA_MODEL ?? 'gemma4:12b';
  const client = new OpenAI({ apiKey: 'ollama', baseURL });
  return { client, model };
}

function makeAzureClient(): { client: AzureOpenAI; model: string } {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';
  if (!endpoint) throw new Error('AZURE_OPENAI_ENDPOINT is required for the azure provider.');
  if (!deployment) throw new Error('AZURE_OPENAI_DEPLOYMENT is required for the azure provider.');

  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (apiKey) {
    const client = new AzureOpenAI({ endpoint, deployment, apiVersion, apiKey });
    return { client, model: deployment };
  }
  // No key: use a locally logged-in identity (az login / managed identity).
  const scope = 'https://cognitiveservices.azure.com/.default';
  const azureADTokenProvider = getBearerTokenProvider(new DefaultAzureCredential(), scope);
  const client = new AzureOpenAI({ endpoint, deployment, apiVersion, azureADTokenProvider });
  return { client, model: deployment };
}

async function streamCompletions(
  client: OpenAI,
  model: string,
  messages: ChatMessage[],
  onDelta: (s: string) => void,
): Promise<void> {
  // ChatMessage is structurally a subset of the SDK's message param union;
  // inference can't unify the plain interface with the discriminated union.
  const sdkMessages = messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  const stream = await client.chat.completions.create({
    model,
    stream: true,
    messages: sdkMessages,
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) onDelta(delta);
  }
}

export async function streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  onDelta: (s: string) => void,
  providerOverride?: Provider,
): Promise<void> {
  const provider = providerOverride ?? activeProvider();
  if (provider === 'mock') {
    await streamMock(messages, onDelta);
    return;
  }
  if (provider === 'claude') {
    await streamClaude(systemPrompt, messages, onDelta);
    return;
  }
  if (provider === 'copilot') {
    await streamCopilot(systemPrompt, messages, onDelta);
    return;
  }
  const withSystem: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...messages];
  const { client, model } =
    provider === 'azure' ? makeAzureClient() : provider === 'ollama' ? makeOllamaClient() : makeOpenAIClient();
  await streamCompletions(client, model, withSystem, onDelta);
}
