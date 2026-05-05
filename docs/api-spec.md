# WC 2026 F2P Prize Planner — API Specification

**Base URL (local dev):** `http://localhost:3000`  
**Framework:** Next.js 16 App Router — handlers live in `app/api/`  
**Auth:** None — internal tool, shared single workspace  
**Response envelope (all endpoints):**

```
Success: { success: true, data: T }
Error:   { success: false, error: string, code: string, details?: object }
```

---

## Endpoints

### GET /api/plans/:market

Load the current saved config for a market.

#### Path parameters

| Parameter | Type   | Required | Validation                                                              |
|-----------|--------|----------|-------------------------------------------------------------------------|
| `market`  | string | Yes      | Must be one of: `romania`, `poland`, `brazil`, `belgium`, `greece`, `serbia` |

#### Auth

None.

#### Response — 200 OK (market has saved data)

```json
{
  "success": true,
  "data": {
    "market": "romania",
    "payload": {
      "market": "romania",
      "game": "All",
      "toggledOff": [15, 22],
      "roundOverrides": {
        "Predictor": {
          "13": { "3/6 correct": { "val": 500, "type": "Coins" } }
        }
      },
      "eventOverrides": { "15-pd": ["France v Senegal", "8:00 PM"] },
      "stateByGame": {
        "Predictor": {
          "3/6 correct": {
            "type": "Coins",
            "perRound": "100",
            "total": "3800",
            "lastEdited": "perRound"
          }
        }
      },
      "streakPrizeState": {
        "romania": {
          "4": {
            "VIP": {
              "type": "Coins",
              "perRound": "200",
              "total": "",
              "lastEdited": "perRound"
            }
          }
        }
      },
      "lbState": {
        "🥇 Gold": { "type": "Free Bets", "prizePerLb": "1000", "numLbs": "2" }
      }
    },
    "updatedAt": "2026-05-01T10:30:00.000Z"
  }
}
```

#### Response — 200 OK (market has no saved data yet)

Returns `payload: null` and `updatedAt: null`. The frontend treats this as first visit and renders defaults.

```json
{
  "success": true,
  "data": {
    "market": "romania",
    "payload": null,
    "updatedAt": null
  }
}
```

#### Response — 400 Bad Request (invalid market)

```json
{
  "success": false,
  "error": "Invalid market. Must be one of: romania, poland, brazil, belgium, greece, serbia",
  "code": "INVALID_MARKET",
  "details": [
    {
      "code": "invalid_enum_value",
      "path": [],
      "message": "Invalid market. Must be one of: ..."
    }
  ]
}
```

#### Response — 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to load plan",
  "code": "DB_ERROR"
}
```

#### Example request

```bash
curl http://localhost:3000/api/plans/romania
```

---

### PUT /api/plans/:market

Upsert the full planner state for a market. This is the auto-save endpoint — the frontend calls it with a 1-second debounce on every state change.

On first call for a market, a new row is created. On subsequent calls, the payload is replaced in full.

#### Path parameters

| Parameter | Type   | Required | Validation                                                              |
|-----------|--------|----------|-------------------------------------------------------------------------|
| `market`  | string | Yes      | Must be one of: `romania`, `poland`, `brazil`, `belgium`, `greece`, `serbia` |

#### Request body

`Content-Type: application/json`

| Field     | Type   | Required | Validation                              |
|-----------|--------|----------|-----------------------------------------|
| `payload` | object | Yes      | Non-null JSON object. No further schema constraints — the frontend owns the internal shape. |

```json
{
  "payload": {
    "market": "romania",
    "game": "All",
    "toggledOff": [15, 22],
    "roundOverrides": {},
    "eventOverrides": {},
    "stateByGame": {
      "Predictor": {
        "3/6 correct": {
          "type": "Coins",
          "perRound": "100",
          "total": "3800",
          "lastEdited": "perRound"
        }
      }
    },
    "streakPrizeState": {},
    "lbState": {}
  }
}
```

#### Auth

None.

#### Response — 200 OK

Returns the saved record (identical to GET 200 response).

```json
{
  "success": true,
  "data": {
    "market": "romania",
    "payload": { "...": "full payload as sent" },
    "updatedAt": "2026-05-01T10:31:45.123Z"
  }
}
```

#### Response — 400 Bad Request (invalid market)

```json
{
  "success": false,
  "error": "Invalid market. Must be one of: romania, poland, brazil, belgium, greece, serbia",
  "code": "INVALID_MARKET"
}
```

#### Response — 400 Bad Request (invalid JSON body)

```json
{
  "success": false,
  "error": "Request body must be valid JSON",
  "code": "INVALID_JSON"
}
```

#### Response — 422 Unprocessable Entity (payload validation failure)

Returned when `payload` is missing, null, or not an object.

```json
{
  "success": false,
  "error": "Invalid request body",
  "code": "VALIDATION_ERROR",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "payload": ["Required"]
    }
  }
}
```

#### Response — 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to save plan",
  "code": "DB_ERROR"
}
```

#### Example request

```bash
curl -X PUT http://localhost:3000/api/plans/romania \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "market": "romania",
      "game": "All",
      "toggledOff": [],
      "roundOverrides": {},
      "eventOverrides": {},
      "stateByGame": {},
      "streakPrizeState": {},
      "lbState": {}
    }
  }'
```

---

## Error codes reference

| Code               | HTTP status | Meaning                                               |
|--------------------|-------------|-------------------------------------------------------|
| `INVALID_MARKET`   | 400         | `:market` path param is not a recognised market slug  |
| `INVALID_JSON`     | 400         | Request body could not be parsed as JSON              |
| `VALIDATION_ERROR` | 422         | Body parsed as JSON but failed schema validation      |
| `DB_ERROR`         | 500         | Database read/write failed (details not exposed)      |

---

## Valid market values

| Slug       | Market   |
|------------|----------|
| `romania`  | Romania  |
| `poland`   | Poland   |
| `brazil`   | Brazil   |
| `belgium`  | Belgium  |
| `greece`   | Greece   |
| `serbia`   | Serbia   |

---

## Database schema

Single table: `plans`

| Column       | Type        | Constraints              | Notes                              |
|--------------|-------------|--------------------------|-------------------------------------|
| `id`         | integer     | PK, auto-increment        |                                     |
| `market`     | varchar     | UNIQUE, NOT NULL          | One of the six valid market slugs   |
| `payload`    | jsonb       | NOT NULL                  | Full planner state — arbitrary JSON |
| `updated_at` | timestamptz | NOT NULL, auto-updated    | Set by Prisma `@updatedAt`          |

Migration is managed by Prisma. To apply to a fresh database:

```bash
# First-time setup
pnpm db:push         # push schema directly (no migration history — dev/Railway)

# Or with full migration history
pnpm db:migrate      # creates migration file + applies it
```

Requires `DATABASE_URL` set in `.env.local`. See `.env.example`.

---

## Environment variables

| Variable       | Required | Description                              |
|----------------|----------|------------------------------------------|
| `DATABASE_URL` | Yes      | PostgreSQL connection string (see `.env.example`) |
