import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock } from '@/test-utils/supabase-mock';

const mockGetAuthUser = vi.fn();
vi.mock('@/lib/server-auth', () => ({ getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args) }));

let supabaseMock: ReturnType<typeof createSupabaseMock>;
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => supabaseMock,
}));

describe('GET /api/contacts', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetAuthUser.mockReset();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null);
    supabaseMock = createSupabaseMock({});
    const { GET } = await import('./route');
    const res = await GET(new Request('http://test/api/contacts'));
    expect(res.status).toBe(401);
  });

  // Regression test: contact_applications must be scoped to the requesting
  // user's own contact IDs. A prior version fetched this table unfiltered,
  // leaking every user's contact-application links to any authenticated caller.
  it('scopes contact_applications lookup to the caller\'s own contact IDs', async () => {
    mockGetAuthUser.mockResolvedValue({ id: 'user-1' });
    supabaseMock = createSupabaseMock({
      contacts: { data: [{ id: 'contact-a' }, { id: 'contact-b' }], error: null },
      contact_applications: { data: [], error: null },
    });

    const { GET } = await import('./route');
    await GET(new Request('http://test/api/contacts'));

    const linksChain = supabaseMock.chains['contact_applications'];
    const inCall = linksChain.calls.find(c => c.method === 'in');
    expect(inCall).toBeDefined();
    expect(inCall?.args).toEqual(['contact_id', ['contact-a', 'contact-b']]);
  });

  it('skips the contact_applications query entirely when the user has no contacts', async () => {
    mockGetAuthUser.mockResolvedValue({ id: 'user-1' });
    supabaseMock = createSupabaseMock({
      contacts: { data: [], error: null },
    });

    const { GET } = await import('./route');
    const res = await GET(new Request('http://test/api/contacts'));
    const body = await res.json();

    expect(body.contacts).toEqual([]);
    // contact_applications was never called with .in() since contactIds is empty
    expect(supabaseMock.from).not.toHaveBeenCalledWith('contact_applications');
  });

  it('scopes the contacts query itself to the requesting user', async () => {
    mockGetAuthUser.mockResolvedValue({ id: 'user-42' });
    supabaseMock = createSupabaseMock({
      contacts: { data: [], error: null },
    });

    const { GET } = await import('./route');
    await GET(new Request('http://test/api/contacts'));

    const contactsChain = supabaseMock.chains['contacts'];
    const eqCall = contactsChain.calls.find(c => c.method === 'eq');
    expect(eqCall?.args).toEqual(['user_id', 'user-42']);
  });
});
