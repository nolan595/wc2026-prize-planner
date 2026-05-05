/**
 * Tests for GET and PUT /api/plans/[market].
 *
 * Prisma is fully mocked so no DB connection is needed. The route is invoked by
 * constructing a NextRequest and calling the handler directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Prisma before importing the route ────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    plan: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { GET, PUT } from '@/app/api/plans/[market]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGetRequest(market: string): [NextRequest, { params: Promise<{ market: string }> }] {
  const req = new NextRequest(`http://localhost/api/plans/${market}`);
  const ctx = { params: Promise.resolve({ market }) };
  return [req, ctx];
}

function makePutRequest(
  market: string,
  body: unknown
): [NextRequest, { params: Promise<{ market: string }> }] {
  const req = new NextRequest(`http://localhost/api/plans/${market}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ctx = { params: Promise.resolve({ market }) };
  return [req, ctx];
}

const mockFindUnique = prisma.plan.findUnique as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.plan.upsert as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/plans/[market]', () => {
  it('returns 200 with payload when a plan exists', async () => {
    const now = new Date('2026-06-01T12:00:00Z');
    mockFindUnique.mockResolvedValue({
      market: 'romania',
      payload: { game: 'Streak', toggledOff: [] },
      updatedAt: now,
    });

    const [req, ctx] = makeGetRequest('romania');
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.market).toBe('romania');
    expect(body.data.payload).toEqual({ game: 'Streak', toggledOff: [] });
    expect(body.data.updatedAt).toBe(now.toISOString());
  });

  it('returns 200 with null payload for a new market (no saved plan)', async () => {
    mockFindUnique.mockResolvedValue(null);

    const [req, ctx] = makeGetRequest('poland');
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.payload).toBeNull();
    expect(body.data.updatedAt).toBeNull();
  });

  it('returns 400 for an invalid market param', async () => {
    const [req, ctx] = makeGetRequest('invalid-market');
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('INVALID_MARKET');
  });

  it('returns 500 when the DB throws', async () => {
    mockFindUnique.mockRejectedValue(new Error('Connection refused'));

    const [req, ctx] = makeGetRequest('brazil');
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.code).toBe('DB_ERROR');
  });

  it('validates all six valid markets without DB error', async () => {
    mockFindUnique.mockResolvedValue(null);

    const markets = ['romania', 'poland', 'brazil', 'belgium', 'greece', 'serbia'];
    for (const m of markets) {
      const [req, ctx] = makeGetRequest(m);
      const res = await GET(req, ctx);
      expect(res.status).toBe(200);
    }
  });
});

// ── PUT ───────────────────────────────────────────────────────────────────────

describe('PUT /api/plans/[market]', () => {
  const validPayload = {
    market: 'romania',
    game: 'All',
    toggledOff: [],
    roundOverrides: {},
    eventOverrides: {},
    stateByGame: {},
    streakPrizeState: {},
    lbState: {},
  };

  it('returns 200 with the updated record on successful upsert', async () => {
    const now = new Date('2026-06-01T13:00:00Z');
    mockUpsert.mockResolvedValue({
      market: 'romania',
      payload: validPayload,
      updatedAt: now,
    });

    const [req, ctx] = makePutRequest('romania', { payload: validPayload });
    const res = await PUT(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.market).toBe('romania');
    expect(body.data.updatedAt).toBe(now.toISOString());
    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  it('returns 400 for an invalid market param', async () => {
    const [req, ctx] = makePutRequest('invalid-market', { payload: validPayload });
    const res = await PUT(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('INVALID_MARKET');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/plans/romania', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not valid json ]',
    });
    const ctx = { params: Promise.resolve({ market: 'romania' }) };
    const res = await PUT(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('INVALID_JSON');
  });

  it('returns 422 when the body is missing the payload field', async () => {
    const [req, ctx] = makePutRequest('romania', { notPayload: {} });
    const res = await PUT(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when payload is null', async () => {
    const [req, ctx] = makePutRequest('romania', { payload: null });
    const res = await PUT(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 when the DB throws', async () => {
    mockUpsert.mockRejectedValue(new Error('Connection refused'));

    const [req, ctx] = makePutRequest('romania', { payload: validPayload });
    const res = await PUT(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.code).toBe('DB_ERROR');
  });

  it('passes the correct market and payload to prisma.plan.upsert', async () => {
    const now = new Date();
    mockUpsert.mockResolvedValue({ market: 'greece', payload: validPayload, updatedAt: now });

    const [req, ctx] = makePutRequest('greece', { payload: validPayload });
    await PUT(req, ctx);

    expect(mockUpsert).toHaveBeenCalledOnce();
    const call = mockUpsert.mock.calls[0][0];
    // The service calls prisma.plan.upsert with a Prisma options object
    expect(call.where).toEqual({ market: 'greece' });
    expect(call.create.market).toBe('greece');
    expect(call.update.payload).toEqual(validPayload);
  });
});
