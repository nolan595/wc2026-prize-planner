# WC 2026 F2P Prize Planner — Design Specification

**Product type:** Internal planning tool  
**Users:** Market managers across Romania, Poland, Brazil, Belgium, Greece, Serbia  
**Stack:** Next.js 15 App Router · Tailwind CSS 4 · Framer Motion  
**Prototype reference:** `WC_Prize_Planner.html` (single-file HTML, reviewed and used as source of truth for palette, layout logic, and component catalogue)

---

## 1. Concept & Direction

### Core aesthetic
**Dark operational interface** — the visual register of a sports broadcast control room crossed with a financial dashboard. Deep navy backgrounds, gold signal colour, per-game chromatic coding. Everything communicates function first. This is a tool used under time pressure by people who know what they're doing; the UI must accelerate decisions, not explain itself.

### What makes this design specific
- The game colour system (Streak red / Match Line green / Predictor blue) is load-bearing. It encodes information at a glance across the calendar grid, prize tables, and summary cards simultaneously. Every component touches this colour system.
- The calendar is the central UI — it is not a decorative element. Day cells carry match data, prize tags, toggle state, edit state, and override indicators all in a tight footprint (~120px tall in All-Games mode). Typography choices must support extreme density at small sizes.
- The gold accent (`#f5c518`) is Superbet's signal colour for value and prizes — it is not decorative. Use it only for: headings that name prize totals, tier labels (Gold leaderboard tier), card titles, and active numeric values of significance. Never use it for body copy or general UI chrome.

### Typography rationale
Segoe UI / Arial from the prototype is adequate for internal use but lacks the precision a data-heavy rebuild demands. The replacement pairing is:

**Display / heading:** [IBM Plex Sans Condensed](https://fonts.google.com/specimen/IBM+Plex+Sans+Condensed) — condensed, technical, legible at small sizes without losing character. Suits all-caps section labels, card titles, and any label that needs to be read alongside numbers. Not Inter. Not Roboto.

**Body / data:** [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) — monospaced for all numeric inputs, prize amounts, round counts, and calculated totals. Aligns decimals and currency values in tables. Gives the tool an instrument-panel quality.

**UI labels / UI text:** IBM Plex Sans (the parent family, non-condensed) — for select labels, match names inside calendar cells, modal body copy, and any flowing text exceeding one line.

All three are from the same IBM Plex super-family, ensuring visual cohesion without needing font-mixing rules.

---

## 2. Colour Tokens

All values as CSS custom properties. Define these on `:root`.

```css
/* ── Backgrounds ────────────────────────── */
--color-bg-base:       #0a1628;   /* page background */
--color-bg-surface:    #112240;   /* cards, panels */
--color-bg-well:       #0d1d36;   /* inputs, table cells, inset panels */
--color-bg-overlay:    rgba(0, 0, 0, 0.75);  /* modal backdrops */

/* ── Borders ────────────────────────────── */
--color-border-default:  #1e3a5f;
--color-border-subtle:   #1a2f4a;
--color-border-strong:   #2a5080;
--color-border-focus:    #4a9eff;

/* ── Text ───────────────────────────────── */
--color-text-primary:    #ffffff;
--color-text-secondary:  #aac4e8;
--color-text-muted:      #7a9abf;
--color-text-faint:      #4a6a8a;

/* ── Brand / Signal ─────────────────────── */
--color-gold:            #f5c518;   /* prize signal, headings, card titles */
--color-gold-subtle:     rgba(245, 197, 24, 0.18);

/* ── Game colours ───────────────────────── */
--color-streak:          #ff5252;   /* Streak — Early AM */
--color-streak-subtle:   rgba(255, 82, 82, 0.08);
--color-streak-badge:    rgba(255, 82, 82, 0.14);

--color-matchline:       #4caf50;   /* Match Line — Afternoon */
--color-matchline-subtle: rgba(76, 175, 80, 0.08);
--color-matchline-badge:  rgba(76, 175, 80, 0.18);

--color-predictor:       #4a9eff;   /* Predictor — Hype Fixture */
--color-predictor-subtle: rgba(74, 158, 255, 0.08);
--color-predictor-badge:  rgba(74, 158, 255, 0.18);

/* ── Interactive ────────────────────────── */
--color-interactive:     #4a9eff;
--color-interactive-hover: #74aeff;
--color-interactive-active: #1a4a8a;

/* ── Override / edit ────────────────────── */
--color-override:        #ff9800;   /* orange — override state indicator */
--color-override-subtle: rgba(255, 152, 0, 0.18);

/* ── Prize type colours ─────────────────── */
--color-prize-coins:       #f5c518;
--color-prize-coins-bg:    rgba(245, 197, 24, 0.18);
--color-prize-freebets:    #74aeff;
--color-prize-freebets-bg: rgba(74, 158, 255, 0.18);
--color-prize-freespins:   #4caf50;
--color-prize-freespins-bg: rgba(76, 175, 80, 0.18);
--color-prize-cash:        #ff9800;
--color-prize-cash-bg:     rgba(255, 152, 0, 0.18);

/* ── Leaderboard tier colours ───────────── */
--color-tier-gold:    #f5c518;
--color-tier-silver:  #b0bec5;
--color-tier-bronze:  #cd7f32;

/* ── Semantic ───────────────────────────── */
--color-success:       #4caf50;
--color-success-bg:    rgba(76, 175, 80, 0.12);
--color-warning:       #ff9800;
--color-warning-bg:    rgba(255, 152, 0, 0.12);
--color-error:         #ff5252;
--color-error-bg:      rgba(255, 82, 82, 0.12);
--color-info:          #4a9eff;
--color-info-bg:       rgba(74, 158, 255, 0.12);

/* ── Calculated field indicator ─────────── */
--color-calculated:   #4caf50;  /* green text for auto-derived values */
```

---

## 3. Typography Scale

### Font families

```css
--font-display:  'IBM Plex Sans Condensed', sans-serif;
--font-body:     'IBM Plex Sans', sans-serif;
--font-mono:     'IBM Plex Mono', monospace;
```

Google Fonts import (place in `<head>` or Next.js `layout.tsx`):
```
https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap
```

### Size scale

| Token | Size | Line height | Letter spacing | Font | Weight | Usage |
|---|---|---|---|---|---|---|
| `--text-2xs` | 10px / 0.625rem | 1.4 | +0.06em | display | 700 | Prize tag labels, slot-game-labels |
| `--text-xs` | 11px / 0.6875rem | 1.4 | +0.05em | display | 600–700 | Field labels (all-caps), table `th`, card titles |
| `--text-sm` | 12px / 0.75rem | 1.45 | +0.02em | body | 400 | Match names in cells, table `td` secondary, hints |
| `--text-base` | 14px / 0.875rem | 1.5 | 0 | body | 400 | Form selects, modal body, general prose |
| `--text-md` | 15px / 0.9375rem | 1.5 | 0 | body | 500 | Table tier labels, segment labels |
| `--text-lg` | 16px / 1rem | 1.4 | -0.01em | display | 600 | Section headings, card title emphasis |
| `--text-xl` | 18px / 1.125rem | 1.35 | -0.02em | display | 700 | Summary card totals |
| `--text-2xl` | 22px / 1.375rem | 1.3 | -0.02em | display | 700 | Page title |
| `--text-3xl` | 28px / 1.75rem | 1.25 | -0.03em | display | 700 | Reserved for future large hero values |

### Numeric / input values
All numeric inputs, calculated totals, round counts, and prize amounts use `--font-mono` at `--text-base` or `--text-md`. This is non-negotiable — monospace alignment in tables is load-bearing for readability.

### All-caps label rule
Section labels, card titles, column headers, and field labels are rendered in `--font-display`, weight 700, `text-transform: uppercase`, letter-spacing `+0.08em`, size `--text-xs`. This mirrors the existing prototype's label system and should be applied consistently.

### Font weight rules
- 700: All-caps labels, card titles, tier badge text, day numbers in calendar cells
- 600: Active tab states, section subheadings, condensed display text
- 500: Table `td` primary text, form control values
- 400: Body copy, match names, hints, secondary cell content

---

## 4. Spacing & Layout

### Base unit
`4px`. All spacing values are multiples of this base.

### Spacing scale

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Tight internal gaps (prize tag gap, icon margin) |
| `--space-2` | 8px | Cell internal padding, between label and input |
| `--space-3` | 12px | Card internal padding (compact), table row padding |
| `--space-4` | 16px | Standard card padding, form field gap |
| `--space-5` | 20px | Between cards |
| `--space-6` | 24px | Section separation |
| `--space-8` | 32px | Major section breaks |
| `--space-10` | 40px | Top/bottom page padding |

### Grid system
- **Max content width:** 1280px, centred with `margin: 0 auto`
- **Page padding:** `--space-6` (24px) left/right on desktop; `--space-4` (16px) on tablet
- **Card grid:** Single column. Cards are full-width within the content column. No side-by-side cards except where explicitly noted (config row, summary grid, share section).
- **Config row:** 2-column grid, equal width, `--space-4` gap
- **Summary grid:** `auto-fit, minmax(160px, 1fr)`, `--space-3` gap
- **Calendar grid:** 7 equal columns (Mon–Sun headers), `--space-1` gap

### Responsive breakpoints

| Name | Min width | Notes |
|---|---|---|
| `sm` | 640px | Minimum supported. Below this the layout is not guaranteed. |
| `md` | 768px | Tablet — reduce calendar cell min-height, compress card padding to `--space-3` |
| `lg` | 1024px | Default layout kicks in fully |
| `xl` | 1280px | Max-width container reached. No behaviour change beyond this. |

**Desktop-first override:** The tool is designed for lg+ (laptop/desktop). Tablet (md) should be functional but compressed — calendar cells will be tighter, prize table columns collapse to stacked layout if needed. No breakpoint below 640px is supported; a viewport too small simply scrolls horizontally on the calendar.

### Container padding rules
- At `lg+`: 24px left/right
- At `md`: 16px left/right
- At `sm`: 16px left/right, calendar scrolls horizontally if cells cannot fit

---

## 5. Component Inventory

Each component is described with its purpose, all states it must handle, variants where applicable, and exact visual behaviour. Components are listed in render order (top to bottom of the page).

---

### 5.1 PageHeader

**Purpose:** Application identity bar at the top of the page.

**Contents:**
- Left: Application title "WC 2026 — F2P Prize Planner" in `--font-display`, `--text-2xl`, weight 700, colour `--color-gold`, `text-transform: uppercase`, letter-spacing `+0.05em`
- Right: `SaveStatusIndicator` component (see 5.12)
- No navigation. No user menu. Single persistent bar.

**Visual:** No background card. Sits directly on `--color-bg-base`. Padding bottom `--space-5`.

---

### 5.2 GameGuideCard

**Purpose:** Reference panel explaining the three game types. Read-only. Always visible.

**Layout:** Card with `--color-bg-surface` background, `--color-border-default` border, `--space-4` padding.

**Inner grid:** Three equal-width panels in a row (`auto-fit, minmax(220px, 1fr)`), each with:
- Left border 3px solid in the game's colour (`--color-streak`, `--color-matchline`, `--color-predictor`)
- Background `--color-bg-well`
- Game name in `--font-display` 700 all-caps at `--text-xs`, game colour
- Game description in `--font-body` 400 at `--text-sm`, colour `--color-text-secondary`, line-height 1.55

**States:** None. This is a static reference panel. It can be collapsed (future consideration) but is open by default.

---

### 5.3 ConfigurationBar

**Purpose:** Market and Game selectors that govern all data below.

**Layout:** Card with 2-column config row.

**Components inside:**
- `MarketSelector` (see 5.4)
- `GameSelector` (see 5.5)

---

### 5.4 MarketSelector

**Purpose:** Dropdown to select which Superbet market is being planned.

**Options:** Romania, Poland, Brazil, Belgium, Greece, Serbia (with flag emoji prefix)

**Visual:**
- Label above: `--font-display` 700 all-caps `--text-xs` `--color-text-muted`
- Select element: `--color-bg-well` background, `--color-border-strong` border 1px, `--color-text-primary`, `--font-body` `--text-base`, border-radius 6px, padding `8px 10px`
- Focus state: border-color `--color-border-focus`, no outline, box-shadow `0 0 0 2px rgba(74, 158, 255, 0.25)`
- Hover state: border-color `--color-border-focus` at 60% opacity

**Interaction:** On change, the entire planner state resets (as per prototype logic). No confirmation modal required — market managers understand this.

---

### 5.5 GameSelector

**Purpose:** Dropdown to select which game is being configured, or "All Games" overview mode.

**Options:** All Games, Predictor, Streak, Match Line

**Visual:** Same styling as `MarketSelector`.

**Behaviour:** Changing game changes the calendar display mode (Single-game view vs. All-Games view), prize table content, and shows/hides the Leaderboard card.

---

### 5.6 CalendarCard

**Purpose:** The primary workspace. Displays the WC 2026 fixture schedule across June (Group Stage) and July (Knockouts). Users toggle rounds on/off and access per-round overrides from here.

**Structure:**
- Card with standard surface/border
- Card title: "WC 2026 — Schedule" left, `RoundBadge` right
- Month tabs below title (see `MonthTabs`, 5.7)
- Calendar grid (see `CalendarGrid`, 5.8)
- Override panel below grid (see `OverridePanel`, 5.9) — conditionally rendered

---

### 5.7 MonthTabs

**Purpose:** Toggle between June (Group Stage) and July (Knockouts).

**Tabs:** "June — Group Stage", "July — Knockouts"

**Visual:**
- Pill-shaped buttons, border-radius 20px
- Default: `--color-bg-surface` background, `--color-border-default` border, `--color-text-muted` text, `--font-display` 600 `--text-xs`
- Hover: border-color `--color-border-focus`, text `--color-text-secondary`
- Active: background `--color-interactive-active` (`#1a4a8a`), border-color `--color-border-focus`, text `--color-text-primary`

**Transition:** border-color and background, 120ms ease-out

---

### 5.8 CalendarGrid + DayCell

**Purpose:** 7-column grid rendering every day of June or July. Each cell represents one calendar day.

#### CalendarGrid

- 7 columns, equal width, gap `--space-1`
- Row 1: Day-of-week headers (Mon–Tue–Wed–Thu–Fri–Sat–Sun)
  - `--font-display` 700 all-caps `--text-2xs`, colour `--color-gold`, background `--color-bg-well`, border-radius 4px, padding 5px 2px, text-align centre
- Rows 2+: DayCell components

**All-Games mode:** Cells taller (`min-height: 120px`) to accommodate three SlotStrip rows.  
**Single-game mode:** Cells shorter (`min-height: 80px`).

#### DayCell — State matrix

Each cell exists in exactly one primary state from this hierarchy:

| State | Applies when | Visual treatment |
|---|---|---|
| **Empty** | Padding cells before first fixture | Transparent background, no border |
| **No-fixture** | Day exists in the month but has no match assigned to this slot | `--color-bg-well` background, 30% opacity, `--color-border-subtle` border. Hover: opacity 70%, shows `AddRoundButton` (+) centred |
| **Has-fixture** | A match is assigned to this slot | `--color-bg-well` background, `--color-border-subtle` border, game-colour left border (3px), see below |
| **Toggled-off** | Has fixture, but user has excluded this round | Has-fixture styles but: opacity 28%, left border reverts to `--color-border-subtle`, shows ✕ mark next to date |
| **Editing** | Override panel is open for this day | Has-fixture styles but: border-color `--color-override` (`#ff9800`), box-shadow `0 0 0 1px var(--color-override)` |

**Has-fixture left-border colours:**
- Streak: `--color-streak`
- Match Line: `--color-matchline`
- Predictor: `--color-predictor`
- All-Games mode: no single left border — each SlotStrip carries its own left border

**Cell hover (has-fixture only):**
- Border-color transitions to `--color-border-focus`
- `DayActionButtons` appear (see below)
- Transition: 150ms ease-out

**Cell contents (Single-game mode):**
1. `DayNumber` — `--font-display` 700 `--text-xs` colour `--color-text-secondary`; includes ✕ icon if toggled-off, orange dot if has override
2. Match name — `--font-body` 400 `--text-sm` colour `--color-text-muted`, line-height 1.3
3. Match time (in market's local time) — `--font-mono` 400 `--text-2xs` colour `--color-text-faint`
4. `PrizeTagStrip` — row of PrizeTags (see 5.10)
5. `DayActionButtons` — hidden until cell hover (see below)

**Cell contents (All-Games mode):**
1. `DayNumber`
2. Three `SlotStrip` components (Streak / ML / Predictor), each showing:
   - Left border 2px in game colour
   - Background: game-colour-subtle
   - Game label (2xs, game colour, all-caps)
   - Match name (sm, muted)
   - Match time (2xs, faint, mono)
   - Swap button (icon-only, right-aligned, faint colour, hover: white)

#### DayActionButtons

Absolutely positioned, top-right corner of cell. Hidden by default; visible on cell hover.

- Edit button (`✏` icon or pencil SVG): opens OverridePanel for this day. Only shown when round is not toggled off.
- Swap button (`↺` icon): opens SwapModal.
- Button styling: `--color-interactive-active` background, no border, `--color-text-muted` icon, border-radius 3px, padding 2px 5px. Hover: background `--color-border-strong`, icon `--color-text-primary`.

#### AddRoundButton

Shown on no-fixture cells on hover. Circular (+) button, centred in the cell.
- Background `--color-interactive-active`, border 1px dashed `--color-border-strong`, colour `--color-predictor`, border-radius 50%, 28px × 28px.

#### OverrideIndicatorDot

6px × 6px circle, `--color-override` background, border-radius 50%, displayed inline after the day number when a round has a prize override.

---

### 5.9 OverridePanel

**Purpose:** Inline panel that appears below the calendar grid when a user clicks the edit button on a fixture cell. Allows per-round prize overrides across all tiers.

**Visual:**
- Background `--color-bg-well`, border 1px solid `--color-override`, border-radius 8px, padding `--space-4`
- Header: "Prize Override — [Date]: [Match Name]" in `--font-display` 700 all-caps `--text-xs` colour `--color-override`; close button (✕) right-aligned, `--color-text-muted`, hover: `--color-text-primary`
- Inner grid: `auto-fill, minmax(170px, 1fr)`, gap `--space-2`

**Per-tier override field:**
- Label (tier name) in `--font-display` 600 all-caps `--text-2xs` `--color-text-muted`
- Prize type select (standard select styling)
- Number input (standard number input styling)
- Placeholder shows the current default value in grey

**Buttons:**
- "Clear Override" — ghost button, border `--color-border-strong`, text `--color-text-muted`; hover: border `--color-border-focus`, text `--color-text-primary`

**Animation (Framer Motion):**
- Entry: `opacity 0 → 1`, `translateY -8px → 0`, duration 180ms, ease-out
- Exit: `opacity 1 → 0`, `translateY 0 → -8px`, duration 140ms, ease-in

---

### 5.10 PrizeTagStrip + PrizeTag

**Purpose:** Shows a summary of which prize types are configured for a given calendar day, rendered inside the DayCell.

**PrizeTagStrip:** `display: flex`, flex-wrap, gap `--space-1`, margin-top `--space-1`

**PrizeTag:**
- Height approx 16px, padding 1px 5px, border-radius 3px
- Font: `--font-mono` 600 `--text-2xs`
- Four variants, each using prize type tokens:
  - Coins: background `--color-prize-coins-bg`, text `--color-prize-coins`
  - Free Bets: background `--color-prize-freebets-bg`, text `--color-prize-freebets`
  - Free Spins: background `--color-prize-freespins-bg`, text `--color-prize-freespins`
  - Cash: background `--color-prize-cash-bg`, text `--color-prize-cash`
  - Streak level (Q4, Q7 etc): background `--color-streak-badge`, text `--color-streak` (lightened: `#ff7070`)

---

### 5.11 RoundBadge

**Purpose:** Shows the count of active rounds for the selected game. Displayed in the CalendarCard header.

**Visual:**
- Background `--color-interactive-active`, colour `--color-predictor`, `--font-mono` 700 `--text-xs`, padding 3px 10px, border-radius 20px, white-space nowrap.
- In All-Games mode: displays `"N Streak · N ML · N Pred"` in a single badge.

---

### 5.12 SaveStatusIndicator

**Purpose:** Provides auto-save feedback in the PageHeader. Always visible; communicates the current persistence state of the planner.

**Four states:**

| State | Trigger | Visual |
|---|---|---|
| **Idle** | No changes since last save (or initial load) | Faint dot (4px, `--color-text-faint`), text "All changes saved" in `--text-xs` `--color-text-faint` |
| **Saving** | A change was made and a debounced save is in flight | Animated pulsing dot (4px, `--color-info`), text "Saving…" in `--text-xs` `--color-text-muted`. Dot: opacity pulse 0.4→1→0.4, 800ms infinite |
| **Saved** | Save completed successfully | Green dot (4px, `--color-success`), text "Saved" in `--text-xs` `--color-success`. Transitions to Idle after 2 seconds. |
| **Error** | Save failed | Red dot (4px, `--color-error`), text "Save failed — click to retry" in `--text-xs` `--color-error`. Entire indicator is clickable to trigger retry. |

**Layout:** `display: flex`, `align-items: center`, gap `--space-2`. Dot is a `span` with border-radius 50%.

**Animation (Framer Motion):**
- State transitions: cross-fade between state labels, 200ms ease-out
- Saved → Idle: auto-transition after 2000ms
- Do NOT animate on initial page load (mount without transition)

---

### 5.13 PrizeBreakdownCard

**Purpose:** Prize configuration table. Content changes based on selected game.

**Card title:** "Prize Breakdown"

**Three modes:**

**Mode A — All Games selected:** Shows a static notice "Select a specific game above to configure prizes." in `--color-text-muted` `--text-base`.

**Mode B — Predictor or Match Line selected:** Renders `PrizeTable` (see 5.14).

**Mode C — Streak selected:** Renders `StreakPrizeTable` (see 5.15). The regular PrizeTable is hidden.

---

### 5.14 PrizeTable

**Purpose:** Tier-by-tier prize configuration for Predictor and Match Line. Bidirectional calculation: entering per-round amount derives total; entering total derives per-round.

**Table structure:**

| Column | Width | Notes |
|---|---|---|
| Tier | ~160px | Tier label (e.g. "4/6 correct"). `--font-body` 500 `--text-md` `--color-text-secondary`. |
| Prize Type | auto | Select dropdown |
| Per Round | ~120px | Number input. White = user-entered. Green (`--color-calculated`) = auto-derived. |
| Total (all rounds) | ~120px | Number input. Inverse colours to Per Round. |

**Table styles:**
- `border-collapse: collapse`
- `th`: `--font-display` 700 all-caps `--text-xs` `--color-gold`, padding `0 8px 8px`, text-align left (right for number columns), border-bottom 1px `--color-border-default`
- `td`: padding `6px 8px`, vertical-align middle
- Row divider: border-bottom 1px `--color-bg-base` between rows (not after last)

**Number input states:**
- User-entered: border `--color-border-strong`, text `--color-text-primary`, background `--color-bg-well`
- Auto-calculated: border `--color-border-subtle`, text `--color-calculated`, background `--color-bg-base`
- Focus (either): border `--color-border-focus`, box-shadow `0 0 0 2px rgba(74, 158, 255, 0.2)`
- Font: `--font-mono` `--text-base`, text-align right

**Select dropdown:** Same as MarketSelector but smaller: padding `5px 7px`, `--text-sm`.

---

### 5.15 StreakPrizeTable

**Purpose:** Streak-specific prize table. Organises prizes by streak level (e.g. Q4, Q7) and player segment (VIP, HV, etc.). Each market has its own level and segment configuration.

**Structure:** Single `<table>` with grouped rows under level sub-headers.

**Level sub-header row:**
- Full-width `<td colspan=4>`
- Background `--color-bg-well`, text "Prize Level" in `--color-streak` `--text-xs` 700 all-caps + streak level badge (`Q4`)
- StreakLevelBadge: background `rgba(255,82,82,0.12)`, border 1px solid `rgba(255,82,82,0.3)`, colour `--color-streak`, `--font-mono` 600 `--text-2xs`, padding 1px 6px, border-radius 10px

**Data rows (same column structure as PrizeTable):**
- Segment label column: `--font-body` 400 `--text-sm` `--color-text-muted`, width ~150px
- Prize Type, Per Player/Round, × Active Rounds columns identical to PrizeTable

---

### 5.16 LeaderboardCard

**Purpose:** Leaderboard prize configuration. Only visible when Streak game is selected.

**Card title:** "Leaderboard"

**Table columns:** Tier | Prize Type | Prize per Leaderboard | No. of Leaderboards | Total Cost

**Tier column colour variants:**
- Gold tier: `--color-tier-gold`
- Silver tier: `--color-tier-silver`
- Bronze tier: `--color-tier-bronze`

All other table styles identical to PrizeTable. Total Cost column is always read-only and auto-calculated (shown in `--color-calculated`).

**Show/hide behaviour:** Animated in/out with Framer Motion: `height` animation from 0 to auto, `opacity` 0→1, 200ms ease-out. Do not use CSS `display: none` — use `AnimatePresence`.

---

### 5.17 SummaryCard

**Purpose:** Aggregate prize totals across all active rounds, broken down by prize type.

**Card title:** "Summary"

**Empty state:** "Enter prize amounts above to see totals." in `--color-text-faint` `--text-base`.

**SummaryGrid:** `auto-fit, minmax(160px, 1fr)`, gap `--space-3`

**SummaryItem:**
- Background `--color-bg-well`, border-radius 8px, padding `12px 14px`
- Left border 3px solid in prize type colour (Coins = gold, Free Bets = predictor-blue, Free Spins = matchline-green, Cash = override-orange)
- Label: `--font-display` 700 all-caps `--text-xs` `--color-text-muted`
- Total: `--font-mono` 700 `--text-xl` `--color-text-primary`
- Sub-line (Streak only): `--font-body` 400 `--text-xs` `--color-text-muted`, showing "Instant: N · LB: N"

**Streak note item:** Full-width (grid-column 1 / -1), subdued left border `--color-text-faint`, contains explanatory text at `--text-xs` `--color-text-muted`.

---

### 5.18 ShareCard

**Purpose:** Config export/import for collaboration. Users share a base64-encoded string via Google Chat, email, etc.

**Layout:** Two-column row within the card (flex, gap `--space-3`, wrapping)

**Export column (flex: 1, min-width 220px):**
- Label: all-caps `--text-xs` `--color-text-muted`
- "Copy config to clipboard" button (primary style — see Button styles below)
- Confirmation message below button: `--text-xs` `--color-success` for success; `--text-xs` `--color-error` for failure. Message auto-clears after 3 seconds.

**Import column (flex: 2, min-width 260px):**
- Label: all-caps `--text-xs` `--color-text-muted`
- Text input + "Load" button (horizontal row)
- Text input: `--color-bg-well` background, `--color-border-strong` border, `--color-text-primary`, border-radius 6px, padding `7px 10px`, `--text-base`; placeholder text in `--color-text-faint`
- Feedback message: `--text-xs`, green for success, red for error

**Explanatory hint:** `--font-body` `--text-xs` `--color-text-faint` italic, below the row.

---

### 5.19 SwapModal

**Purpose:** Allows reassigning a WC match to a slot, or resetting to the default. Used for both fixture swaps and adding custom events on July blank days.

**Two subtypes:**
1. **Swap:** Select a different WC match from the day's match pool
2. **Custom Event:** Free-text entry for non-WC events (July blank days)

**Modal overlay:** `position: fixed`, full viewport, `--color-bg-overlay` background. Click outside to close.

**ModalBox:**
- Background `--color-bg-surface`, border 1px `--color-border-strong`, border-radius 10px, padding 22px
- Min-width 340px, max-width 440px, centred on screen
- Header: `--font-display` 700 all-caps `--text-xs` `--color-gold`, flex row with title left and close button (✕) right
- Sub-line: `--text-sm` `--color-text-muted`
- Select or inputs (standard form styles)
- Buttons: "Apply" (primary), "Reset to Default" (ghost) — see Button styles

**Animation (Framer Motion):**
- Backdrop: opacity 0→1, 200ms
- Box: opacity 0→1, scale 0.96→1, translateY +8px→0, 200ms ease-out
- Exit is reversed at 140ms

---

### 5.20 Button Styles

Three button variants used throughout. No other button styles exist.

**Primary:**
- Background `--color-interactive-active`, border 1px `--color-predictor`, colour `--color-predictor`
- `--font-body` 500 `--text-sm`, padding 6px 16px, border-radius 6px
- Hover: background `--color-predictor`, colour `#000000`
- Transition: background, colour 150ms ease-out

**Ghost:**
- Background transparent, border 1px `--color-border-strong`, colour `--color-text-muted`
- Same typography as Primary
- Hover: border-color `--color-border-focus`, colour `--color-text-primary`

**Destructive / Clear:**
- Same as Ghost but used for "Clear Override" — no colour change, just opacity reduction on hover

**Icon button (DayActionButtons, swap buttons in cell):**
- Background `--color-interactive-active`, no border, border-radius 3px, 24px × 20px approx
- Icon colour `--color-text-muted`; hover background `--color-border-strong`, icon `--color-text-primary`

---

### 5.21 FormField

Shared pattern for label + input/select pairings used in ConfigurationBar and OverridePanel.

- Label: `display: block`, `--font-display` 700 all-caps `--text-xs` `--color-text-muted`, letter-spacing +0.05em, margin-bottom `--space-2`
- Select/Input: width 100%, styles as defined in their respective sections above

---

## 6. Motion & Interaction

### Principles
This is a data-entry tool. Animations must serve communication, not decoration. The rule: if the animation costs more than 150ms of perceived time, question whether it adds clarity. No animations that block interaction. No animations on every keystroke.

### Easing curves
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in:  cubic-bezier(0.4, 0, 1, 1);
--ease-inout: cubic-bezier(0.4, 0, 0.2, 1);
```

### Duration scale
```css
--duration-fast:    120ms;  /* state-change micro-animations: hover, focus rings */
--duration-default: 180ms;  /* panel reveals, badge updates */
--duration-modal:   200ms;  /* modal entrance/exit */
--duration-slow:    300ms;  /* page-level transitions (if any) */
```

### Which interactions get transitions

| Interaction | Has animation | Type |
|---|---|---|
| Cell hover (border, opacity) | Yes | 150ms ease-out |
| Month tab switch | Yes | 120ms ease-out |
| Override panel open/close | Yes | 180ms ease-out, translateY -8px |
| Modal backdrop fade | Yes | 200ms ease-out |
| Modal box entrance/exit | Yes | 200ms ease-out, scale + translateY |
| Leaderboard card show/hide | Yes | 200ms ease-out, height + opacity |
| Save status indicator state change | Yes | 200ms cross-fade |
| Save status "saving" pulse | Yes | 800ms infinite opacity pulse |
| Number input value changes | No | Immediate (user typing) |
| Prize tag appearance | No | Immediate (recalculation feedback) |
| Calendar cell toggle on/off | Yes | 150ms opacity transition |
| Page load / initial render | No | No entrance animations |

### Scroll behaviour
- Page scroll: standard browser default, no custom scroll behaviour
- Calendar grid does not internally scroll; it is a fixed-height grid within the page
- Override panel pushes content down; it does not overlay the calendar

### `prefers-reduced-motion` rule
All Framer Motion animations must check `useReducedMotion()`. When reduced motion is preferred:
- All `duration` values become 0 (instant)
- The saving pulse animation is replaced with a static dot at 60% opacity

---

## 7. Accessibility Requirements

### Contrast ratios
- All body text (`--color-text-primary`, `--color-text-secondary` on `--color-bg-surface`): must meet WCAG AA minimum 4.5:1
- Muted text (`--color-text-muted` on `--color-bg-well`): meets 3.0:1 — acceptable for non-essential UI labels in an internal tool
- Prize tags: the background/text combinations for Coins, Free Bets, Free Spins, Cash have been preserved from the prototype and meet AA for their specific sizes (≥11px bold). Do not change the values.
- Gold on navy (`--color-gold` on `--color-bg-surface`): approximately 9:1 — exceeds AAA. Intentional.

### Focus indicators
All interactive elements must have a visible focus ring:
- Default: `outline: 2px solid var(--color-border-focus)`, `outline-offset: 2px`
- Inside dark cards: `box-shadow: 0 0 0 2px var(--color-border-focus)` (outline replacement for rounded elements)
- Never remove focus outlines. The tool has forms and keyboard-navigable tables.

### ARIA patterns

**CalendarGrid:**
- Grid container: `role="grid"`, `aria-label="WC 2026 fixture calendar"`
- Day header cells: `role="columnheader"`
- Day cells: `role="gridcell"`, `aria-label="[Date] [Match name]"`, `aria-pressed` (boolean for toggled-on/off state when has-fixture)
- Empty cells: `aria-hidden="true"`

**Modals:**
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal heading ID
- Focus trap on open; return focus to trigger element on close
- Escape key closes modal

**SaveStatusIndicator:**
- Container: `role="status"`, `aria-live="polite"` — allows screen readers to announce state changes without interrupting user
- Do not use `aria-live="assertive"` — save status is not urgent

**Toggle cells:**
- Clicking a fixture cell toggles it on/off; this needs `role="button"` and `aria-pressed` state

**Tables:**
- All `<table>` elements must have `<caption>` (visually hidden is acceptable using `sr-only` class) or `aria-label`
- All `th` elements must have `scope="col"` (or `scope="row"` for tier labels)
- Number inputs in tables must have `aria-label` including the tier name and column purpose (e.g. `aria-label="4/6 correct — per round amount"`)

### Keyboard navigation
- Tab order: Market selector → Game selector → Month tabs → Calendar cells (arrow key navigation within grid) → Prize table → Summary cards → Share section
- Within calendar grid, arrow keys should move between cells (standard grid keyboard pattern)
- All buttons and links reachable by Tab
- All modals: Tab cycles within modal only while open
