import { vi } from 'vitest';

const CHAIN_METHODS = ['select', 'eq', 'order', 'in', 'insert', 'update', 'delete', 'single', 'gte', 'lte', 'not', 'maybeSingle'];

export interface Chainable {
  calls: { method: string; args: unknown[] }[];
  then: (resolve: (v: unknown) => void) => void;
  [key: string]: unknown;
}

/** A fluent query-builder stand-in. Every filter method records the call and returns itself; awaiting it resolves to `resolvedValue`. */
export function createChainable(resolvedValue: unknown): Chainable {
  const calls: { method: string; args: unknown[] }[] = [];
  const chainable = { calls } as Chainable;
  for (const m of CHAIN_METHODS) {
    chainable[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return chainable;
    };
  }
  chainable.then = (resolve: (v: unknown) => void) => resolve(resolvedValue);
  return chainable;
}

/** Mocks the object returned by createClient(). Maps table name -> canned response. */
export function createSupabaseMock(tableResponses: Record<string, unknown>) {
  const chains: Record<string, Chainable> = {};
  for (const [table, value] of Object.entries(tableResponses)) {
    chains[table] = createChainable(value);
  }
  const from = vi.fn((table: string) => chains[table] ?? createChainable({ data: null, error: null }));
  return { from, chains };
}
