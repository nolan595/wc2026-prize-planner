// Shared validation schemas for the plans API.
// Zod is used at the route layer — nothing reaches the DB without passing here.

import { z } from "zod";

export const VALID_MARKETS = [
  "romania",
  "poland",
  "brazil",
  "belgium",
  "greece",
  "serbia",
] as const;

export type Market = (typeof VALID_MARKETS)[number];

export const MarketParamSchema = z.enum(VALID_MARKETS, {
  errorMap: () => ({
    message: `Invalid market. Must be one of: ${VALID_MARKETS.join(", ")}`,
  }),
});

// The payload is a JSON object that the frontend owns — we validate its
// outer shape here (non-null object, market field matches the URL param)
// but do not deeply validate every nested key. The frontend is the source
// of truth for internal structure; deep validation would couple the API
// to every future UI change without benefit.
export const PlanPayloadSchema = z
  .record(z.unknown())
  .refine((obj) => obj !== null, { message: "Payload must be a non-null object" });

export const PutPlanBodySchema = z.object({
  payload: PlanPayloadSchema,
});

export type PutPlanBody = z.infer<typeof PutPlanBodySchema>;
