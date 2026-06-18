# CarbonLens

Your carbon footprint, kept like a ledger.

CarbonLens treats your daily emissions the way a bank statement treats money: every
logged trip, meal, or energy use posts as a **debit**; every completed reduction action
posts as a **credit**. The running balance is your real, personalized footprint — not a
generic score.

## Why a ledger, not a dashboard

Most carbon trackers show a single number and stop there. CarbonLens is built around
three explicit layers that map directly to the brief — **understand, track, reduce**:

1. **Understand** — the balance card compares your logged total against a published
   global daily average and a climate-aligned target, and identifies your single
   highest-impact category (transport, energy, food, or waste).
2. **Track** — every entry is logged with a timestamp and appears as a line item in the
   ledger, so your history is visible and auditable, not just summarized away.
3. **Reduce** — the recommendation engine ranks actions by real estimated savings,
   prioritizing your highest-impact category first, and marking one done posts a credit
   that directly offsets your balance.

## Architecture

```
src/
  lib/
    emissionFactors.js   — single source of truth for all emission factors
    calculations.js      — pure functions: emissions math, summarization, comparison
    recommendations.js   — pure functions: the personalization/ranking engine
    __tests__/           — unit tests for everything above
  hooks/
    useCarbonLedger.js   — all app state, derived values memoized, localStorage persistence
  components/
    LogEntryForm, Ledger, BalanceSummary, Recommendations — presentation only
```

The calculation and recommendation logic is deliberately framework-free: pure functions
with no React or DOM dependency, so it's trivial to unit test and easy to reason about
or port elsewhere (e.g. to a backend, if this grows past a hackathon).

## How this addresses the judging criteria

**Code quality** — business logic (`lib/`) is fully decoupled from UI (`components/`)
and state (`hooks/`). Functions are small, named for what they do, and documented with
JSDoc comments explaining *why*, not just what. ESLint runs clean with zero warnings.

**Security** — all numeric input is validated (`isValidQuantity`) before it reaches any
calculation, rejecting negative numbers, NaN, Infinity, and non-numeric types rather than
trusting form input. The form layer adds a second validation pass with user-facing error
messages and an upper sanity bound. No `eval`, no `innerHTML`, no dynamically constructed
markup — all rendering goes through React's escaping. `localStorage` reads/writes are
wrapped in try/catch so corrupted or unavailable storage degrades gracefully instead of
crashing the app.

**Efficiency** — derived values (category totals, highest-impact category, benchmark
comparison, recommendations, savings) are computed with `useMemo` keyed off only the
raw state that affects them, so they don't recompute on unrelated re-renders. The entry
log is an O(n) single-pass aggregation, not repeated filtering per category.

**Testing** — 30 unit tests cover the calculation and recommendation logic, including
edge cases (zero-emission transport modes, malformed entries, invalid input types,
empty states, and ranking behavior). Run with `npm test`.

**Accessibility** — semantic landmarks (`header`, `main`, `footer`, labeled `section`s),
a real `<table>` with `<caption>` and scoped headers for the ledger, a `fieldset`/`legend`
for the category picker, `role="radiogroup"` with `aria-checked` on the category pills,
associated `<label>`s on every input, `aria-invalid`/`aria-describedby` wiring the
quantity field to its error message, `role="alert"` on validation errors, visible
`:focus-visible` styling that's never suppressed, and `prefers-reduced-motion` respected
globally.

**Problem statement alignment** — every required behavior in the prompt (understand /
track / reduce, simple actions, personalized insights) has a direct, nameable feature
behind it rather than being implied by a generic UI.

## Running it

```bash
npm install
npm run dev      # start local dev server
npm test         # run the unit test suite
npm run build    # production build
npm run lint     # check code quality
```

## Honest limitations (worth saying out loud in a demo)

Emission factors are rounded averages from public transport/energy/food lifecycle
studies, not audited per-user measurements — the app says this explicitly in its footer
rather than implying false precision. Data persists to `localStorage` only; there's no
backend, account system, or multi-device sync, which was a deliberate scope cut to spend
hackathon time on logic quality and accessibility rather than infrastructure.
