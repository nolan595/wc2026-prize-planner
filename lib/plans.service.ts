// Data-access layer for the plans table.
// Route handlers call these functions — no Prisma client references outside
// this file and lib/prisma.ts.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { Market } from "@/lib/validation";

export type PlanRecord = {
  market: string;
  payload: unknown;
  updatedAt: Date;
};

/**
 * Returns the plan for the given market, or null if one has never been saved.
 */
export async function getPlan(market: Market): Promise<PlanRecord | null> {
  const row = await prisma.plan.findUnique({
    where: { market },
    select: { market: true, payload: true, updatedAt: true },
  });
  return row;
}

/**
 * Upserts the full payload for a market. This is the auto-save path — the
 * frontend sends the entire state object on every debounced change.
 * Returns the updated record.
 */
export async function upsertPlan(
  market: Market,
  payload: Record<string, unknown>
): Promise<PlanRecord> {
  // Cast through Prisma.InputJsonValue — Prisma's Json field requires this type.
  // The caller has already validated the payload is a non-null object via Zod.
  const jsonPayload = payload as unknown as Prisma.InputJsonValue;
  const row = await prisma.plan.upsert({
    where: { market },
    update: { payload: jsonPayload },
    create: { market, payload: jsonPayload },
    select: { market: true, payload: true, updatedAt: true },
  });
  return row;
}
