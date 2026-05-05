// GET  /api/plans/:market  — load current config for a market
// PUT  /api/plans/:market  — upsert full config (auto-save, 1s debounce on FE)
//
// No auth — shared internal workspace. Rate limiting is not implemented here
// because this is behind an internal network; add middleware if exposed externally.

import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import { ok, err } from "@/lib/api-response";
import { MarketParamSchema, PutPlanBodySchema } from "@/lib/validation";
import { getPlan, upsertPlan } from "@/lib/plans.service";

type RouteContext = { params: Promise<{ market: string }> };

export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { market: rawMarket } = await context.params;

  const parsed = MarketParamSchema.safeParse(rawMarket);
  if (!parsed.success) {
    return err(
      parsed.error.errors[0].message,
      "INVALID_MARKET",
      400,
      parsed.error.errors
    );
  }

  try {
    const plan = await getPlan(parsed.data);

    if (!plan) {
      // Return an empty success rather than 404 — the frontend treats a null
      // payload as "first visit for this market" and renders defaults.
      return ok({ market: parsed.data, payload: null, updatedAt: null });
    }

    return ok({
      market: plan.market,
      payload: plan.payload,
      updatedAt: plan.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error("[GET /api/plans/:market]", e);
    return err("Failed to load plan", "DB_ERROR", 500);
  }
}

export async function PUT(
  req: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { market: rawMarket } = await context.params;

  const parsed = MarketParamSchema.safeParse(rawMarket);
  if (!parsed.success) {
    return err(
      parsed.error.errors[0].message,
      "INVALID_MARKET",
      400,
      parsed.error.errors
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Request body must be valid JSON", "INVALID_JSON", 400);
  }

  const bodyParsed = PutPlanBodySchema.safeParse(body);
  if (!bodyParsed.success) {
    return err(
      "Invalid request body",
      "VALIDATION_ERROR",
      422,
      bodyParsed.error.flatten()
    );
  }

  try {
    const plan = await upsertPlan(parsed.data, bodyParsed.data.payload);
    return ok({
      market: plan.market,
      payload: plan.payload,
      updatedAt: plan.updatedAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return err("Payload validation failed", "VALIDATION_ERROR", 422, e.flatten());
    }
    console.error("[PUT /api/plans/:market]", e);
    return err("Failed to save plan", "DB_ERROR", 500);
  }
}
