import { describe, it, expect, vi } from 'vitest';
import { isProServer } from './anthropic';

describe('isProServer', () => {
  it('returns false for null user', () => {
    expect(isProServer(null)).toBe(false);
  });

  it('returns false when pro flag is not set', () => {
    expect(isProServer({ pro: false })).toBe(false);
  });

  it('returns true when pro is true with no expiry', () => {
    expect(isProServer({ pro: true, pro_expires_at: null })).toBe(true);
  });

  it('returns false when pro expiry has passed', () => {
    const past = new Date(Date.now() - 86400_000).toISOString();
    expect(isProServer({ pro: true, pro_expires_at: past })).toBe(false);
  });
});

// callClaude strips markdown code fences Claude sometimes wraps JSON in.
// A regression here breaks every single AI feature route, since callers do
// JSON.parse(await callClaude(...)) and a stray ```json fence throws.
let mockCreate: (...args: unknown[]) => Promise<unknown>;
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: (...args: unknown[]) => mockCreate(...args) };
    },
  };
});

describe('callClaude', () => {
  it('strips ```json fences from the response', async () => {
    mockCreate = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '```json\n{"a":1}\n```' }] });
    const { callClaude } = await import('./anthropic');
    const result = await callClaude('prompt', 'system');
    expect(result).toBe('{"a":1}');
  });

  it('strips bare ``` fences without a language tag', async () => {
    mockCreate = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '```\n{"a":1}\n```' }] });
    const { callClaude } = await import('./anthropic');
    const result = await callClaude('prompt', 'system');
    expect(result).toBe('{"a":1}');
  });

  it('leaves unwrapped JSON untouched', async () => {
    mockCreate = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '{"a":1}' }] });
    const { callClaude } = await import('./anthropic');
    const result = await callClaude('prompt', 'system');
    expect(result).toBe('{"a":1}');
  });

  it('throws when Claude returns a non-text content block', async () => {
    mockCreate = vi.fn().mockResolvedValue({ content: [{ type: 'image' }] });
    const { callClaude } = await import('./anthropic');
    await expect(callClaude('prompt', 'system')).rejects.toThrow('Unexpected response type');
  });
});
