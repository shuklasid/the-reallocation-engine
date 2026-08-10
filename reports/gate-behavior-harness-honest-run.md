# Honest Run — gate-behavior-harness

## Plausibility audit before trusting the output

Before treating any PASS as meaningful, I checked: does a genuinely dead
gate (liveness=0) actually collapse the composite to exactly 0, not just a
small number? Confirmed: `composite=0` exactly (not `0.003` or similar),
because `gateProduct` includes a hard multiplication by 0 — this is the
right behavior, not a rounding coincidence. Does a role past a gate
boundary get *gated*, not merely *down-weighted*? Confirmed via the
boundary scenario (`liveness=0.05` exactly): `recommendation=Skip`,
`reason` explicitly says "gated," not "reduced." This is the specific
failure mode Ch.16 warns about — "ran, looked reasonable, and was wrong
in exactly the way fluency hides" — and I checked for it directly rather
than trusting a clean PASS count.

## Real terminal output — BEFORE the fix (unpatched scorer)

```
$ node scripts/test/gate-behavior-harness.mjs

Gate-Behavior Harness — testing /home/claude/the-reallocation-engine/scripts/score/role-scorer.mjs

✓ PASS — healthy: liveness=1, timeline=1, high votes -> should NOT be gated
✓ PASS — dead liveness: liveness=0 explicit, high votes -> MUST be gated to Skip
✓ PASS — dead timeline: timeline=0 explicit, high votes -> MUST be gated to Skip
✓ PASS — boundary: liveness exactly at gate_zero (0.05) -> MUST be gated (inclusive <=)
✗ FAIL — THE TARGET BUG -- missing liveness field entirely (not 0, just absent), high votes
  expected: MISSING liveness must be treated as a CLOSED gate (fail-closed)
  actual:   recommendation=Apply  composite=0.5557  reason="composite 0.556 ≥ 0.3, gates healthy"
✗ FAIL — THE TARGET BUG -- missing timeline field entirely (not 0, just absent), high votes
  expected: MISSING timeline must be treated as a CLOSED gate (fail-closed)
  actual:   recommendation=Apply  composite=0.6175  reason="composite 0.617 ≥ 0.3, gates healthy"

4/6 scenarios passed.
```

This is real: a role with **no liveness check performed at all** — not a
verified-dead posting, just an absent field — was recommended **Apply**
by the live, currently-shipped scorer, with a composite of 0.556, well
above the 0.30 threshold.

## Real terminal output — AFTER the fix

```
$ node scripts/test/gate-behavior-harness.mjs

✓ PASS — healthy: liveness=1, timeline=1, high votes -> should NOT be gated
✓ PASS — dead liveness: liveness=0 explicit, high votes -> MUST be gated to Skip
✓ PASS — dead timeline: timeline=0 explicit, high votes -> MUST be gated to Skip
✓ PASS — boundary: liveness exactly at gate_zero (0.05) -> MUST be gated (inclusive <=)
✓ PASS — THE TARGET BUG -- missing liveness field entirely (not 0, just absent), high votes
  actual: recommendation=Skip composite=0 reason="gated: liveness data MISSING (upstream never verified it) -- treated as closed, not open (fail-closed, per verified-data contract)"
✓ PASS — THE TARGET BUG -- missing timeline field entirely (not 0, just absent), high votes
  actual: recommendation=Skip composite=0 reason="gated: timeline data MISSING (upstream never verified it) -- treated as closed, not open (fail-closed, per verified-data contract)"

6/6 scenarios passed.
```

## Deliberate break attempt (on the fixed code)

Stopping at "6/6 passed" would have been the fluency trap. I tried to
break the *fixed* scorer with a different kind of bad input: an
out-of-range gate factor.

```
$ cat /tmp/break-test/out_of_range.json
[{"role_id": "break-attempt-1", ...,
  "sponsorship": {"p": 0.5, ...}, "fit": {"p": 0.5, ...},
  "liveness": {"factor": 1.8, "source": "record"},
  "timeline": {"factor": 1.0, "source": "your-input"}}]

$ node scripts/score/role-scorer.mjs /tmp/break-test/out_of_range.json --out-dir /tmp/break-test/out
✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)

$ python3 -c "... print composite, gate_product ..."
composite: 0.585 (should be <= vote_sum=0.325 if liveness were correctly clamped to 1.0 max)
gate_product: 1.8
```

**This found a real, second bug**, distinct from the one this contribution
originally scoped: a gate factor above 1.0 (e.g. from a corrupted upstream
record) inflated the composite to 0.585 — nearly double what the votes
alone justify (0.325) — because nothing clamped the multiplier to a valid
[0,1] range. I fixed this too (`clamp01` in the same patch), added a 7th
harness scenario for it, and re-ran:

```
$ node scripts/test/gate-behavior-harness.mjs
...
✓ PASS — BREAK-ATTEMPT FINDING -- out-of-range liveness factor (1.8) must not inflate the composite
  actual: recommendation=Apply composite=0.325 reason="composite 0.325 ≥ 0.3, gates healthy"

7/7 scenarios passed.
```

**Disclosed scope note:** the original recipe scoped this contribution to
the missing-field bug only. Finding the out-of-range bug via the break
attempt, and fixing it in the same small patch, is a scope extension I'm
naming explicitly rather than quietly folding in — it's a two-line,
low-risk fix serving the identical purpose (gate integrity), not an
unrelated feature creep.

## Regression check

```
$ node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir /tmp/regression-check2
✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)

$ diff (pretty-printed new vs. checked-in role-scores.json)
4c4
<     "generated": "2026-08-06",
---
>     "generated": "2026-06-14",
```

Only the timestamp differs. The fix changes nothing about the reference
example's actual scoring output — every role in that fixture already had
complete `liveness`/`timeline` data.

## Drift check (recipe <-> card)

First run found real drift (my own mistake, not hidden):

```
$ node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md recipes/gate-behavior-harness.card.md
Recipe commands: 0  Card commands: 3
In card but NOT in recipe (card may have invented a command):
  node scripts/test/gate-behavior-harness.mjs
  ...
```

The recipe described commands in prose instead of fenced code blocks, so
the extractor found none. Fixed by rewriting the recipe's Workflow section
into fenced blocks matching the card. Re-run, clean:

```
$ node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md recipes/gate-behavior-harness.card.md
Recipe commands: 3  Card commands: 3
No drift: every command in the recipe appears in the card, and vice versa.
```

## Ethics gate

```
$ npm run verify
conformance: 135 files (77 md · 30 py · 25 js · 1 sh · 1 yaml · 1 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (4 warnings — pre-existing, unrelated to this contribution)

$ npm run doctor
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked
RECIPES (44)
  with lifecycle frontmatter: 44   missing: 0
  by status: DRAFT 42 · RUNNABLE-LIVE 2
```

One real, minor finding along the way: `doctor.mjs`'s recipe scanner
doesn't distinguish a `.card.md` (Ch.4's human-card companion) from a
lifecycle-tracked recipe, and flagged the card for missing frontmatter it
was never conceptually supposed to need. Rather than silently ignore the
warning, I gave the card a minimal frontmatter block and I'm naming the
underlying tooling gap here rather than hiding it — out of scope to fix
`doctor.mjs` itself in this contribution.

## The metric readout

- **7/7 gate-behavior scenarios pass** against the current (patched)
  scorer; 4/6 passed against the original, unpatched scorer (2 real
  failures found and closed, plus 1 additional bug found via break
  attempt and closed in the same patch).
- **0 regressions** on the existing reference example.
- **0 drift** between the recipe and its card (after one real, disclosed
  fix to the recipe's own formatting).

## What the machine could not know

The harness can prove the scorer's behavior on inputs I constructed. It
cannot know how often real upstream scripts (Ch.7-10's sponsorship,
liveness, role-quality, and timeline feeds) actually produce a role record
with a missing or out-of-range gate field in practice — that's a
production-frequency question no unit test can answer, only real-world
logging can. I also can't verify whether the `clamp01` fix is the
*correct* remediation choice versus, say, rejecting an out-of-range record
outright and refusing to score it at all — I chose clamping because it's
the smaller, less disruptive change, but a maintainer with more context on
how "record" values reach this stage might reasonably prefer the stricter
option. That's a human call this contribution hands back, not one it
makes unilaterally.
