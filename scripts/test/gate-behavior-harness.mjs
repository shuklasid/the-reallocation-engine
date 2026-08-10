#!/usr/bin/env node
// gate-behavior-harness.mjs — proves liveness/timeline behave as GATES
// (multipliers that can zero the composite) and not as VOTES (additive terms
// that only nudge the score), per Ch.11's stated design and the capstone's
// named build failure (Ch.16, Appendix 98).
//
// This is a real integration test: it writes actual roles.json fixtures to a
// temp directory, spawns the real `scripts/score/role-scorer.mjs` CLI on each
// one (no mocking, no re-implementing the scoring logic), and asserts on the
// real JSON output the scorer writes to disk.
//
//   node scripts/test/gate-behavior-harness.mjs
//
// Exit code 0 = all scenarios pass. Exit code 1 = at least one scenario
// failed — this is the harness's job: to fail loudly when the gate behaves
// like a vote, and to pass once it doesn't.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCORER = path.resolve('scripts/score/role-scorer.mjs');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-harness-'));

// Fixed, high votes so any failure to gate would clearly show up as a
// composite well above the apply_threshold (0.30) instead of being masked
// by a naturally low score.
const HIGH_VOTES = {
  sponsorship: { p: 0.95, tier: 'Proven', source: 'record' },
  fit: { p: 0.95, source: 'model-judgment' },
};

function runScorer(roleId, roleOverrides) {
  const role = { role_id: roleId, company: 'TestCo', title: 'Test Role', ...HIGH_VOTES, ...roleOverrides };
  const fixturePath = path.join(TMP, `${roleId}.json`);
  const outDir = path.join(TMP, `${roleId}-out`);
  fs.writeFileSync(fixturePath, JSON.stringify([role], null, 2));
  try {
    execFileSync('node', [SCORER, fixturePath, '--out-dir', outDir], { stdio: 'pipe' });
  } catch (e) {
    return { error: e.message, stdout: e.stdout?.toString(), stderr: e.stderr?.toString() };
  }
  const resultPath = path.join(outDir, 'role-scores.json');
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  return result.roles[0];
}

const scenarios = [
  {
    name: 'healthy: liveness=1, timeline=1, high votes -> should NOT be gated',
    overrides: { liveness: { factor: 1.0, source: 'record' }, timeline: { factor: 0.9, source: 'your-input' } },
    assert: (r) => r.machine_recommendation !== 'Skip' || !r.reason.startsWith('gated'),
    expectation: 'not gated (recommendation reflects the high votes)',
  },
  {
    name: 'dead liveness: liveness=0 explicit, high votes -> MUST be gated to Skip',
    overrides: { liveness: { factor: 0.0, source: 'record' }, timeline: { factor: 0.9, source: 'your-input' } },
    assert: (r) => r.machine_recommendation === 'Skip' && r.reason.includes('gated') && r.reason.includes('liveness'),
    expectation: 'gated: liveness (composite zeroed regardless of votes)',
  },
  {
    name: 'dead timeline: timeline=0 explicit, high votes -> MUST be gated to Skip',
    overrides: { liveness: { factor: 1.0, source: 'record' }, timeline: { factor: 0.0, source: 'your-input' } },
    assert: (r) => r.machine_recommendation === 'Skip' && r.reason.includes('gated') && r.reason.includes('timeline'),
    expectation: 'gated: timeline (composite zeroed regardless of votes)',
  },
  {
    name: 'boundary: liveness exactly at gate_zero (0.05) -> MUST be gated (inclusive <=)',
    overrides: { liveness: { factor: 0.05, source: 'record' }, timeline: { factor: 0.9, source: 'your-input' } },
    assert: (r) => r.machine_recommendation === 'Skip' && r.reason.includes('gated'),
    expectation: 'gated (boundary is inclusive, per source: g.factor <= gate_zero)',
  },
  {
    name: 'THE TARGET BUG -- missing liveness field entirely (not 0, just absent), high votes',
    overrides: { timeline: { factor: 0.9, source: 'your-input' } }, // liveness key omitted entirely
    assert: (r) => r.machine_recommendation === 'Skip' || r.trace.gates.find((g) => g.factor === 'liveness')?.multiplier <= 0.05,
    expectation: 'MISSING liveness must be treated as a CLOSED gate (fail-closed) -- absence of evidence is not evidence of an open gate',
  },
  {
    name: 'THE TARGET BUG -- missing timeline field entirely (not 0, just absent), high votes',
    overrides: { liveness: { factor: 1.0, source: 'record' } }, // timeline key omitted entirely
    assert: (r) => r.machine_recommendation === 'Skip' || r.trace.gates.find((g) => g.factor === 'timeline')?.multiplier <= 0.05,
    expectation: 'MISSING timeline must be treated as a CLOSED gate (fail-closed)',
  },
  {
    name: 'BREAK-ATTEMPT FINDING -- out-of-range liveness factor (1.8) must not inflate the composite',
    overrides: { liveness: { factor: 1.8, source: 'record' }, timeline: { factor: 1.0, source: 'your-input' },
      sponsorship: { p: 0.5, tier: 'Proven', source: 'record' }, fit: { p: 0.5, source: 'model-judgment' } },
    assert: (r) => r.trace.gate_product <= 1.0,
    expectation: 'gate_product must be clamped to <= 1.0 (an out-of-range factor cannot inflate the composite above what the votes alone justify)',
  },
];

console.log(`Gate-Behavior Harness — testing ${SCORER}\n`);
let failCount = 0;
const results = [];
for (const s of scenarios) {
  const r = runScorer(s.name.split(':')[0].replace(/\s+/g, '_'), s.overrides);
  let pass;
  try { pass = s.assert(r); } catch (e) { pass = false; }
  if (!pass) failCount++;
  results.push({ name: s.name, pass, expectation: s.expectation, actual_recommendation: r.machine_recommendation, actual_reason: r.reason, actual_composite: r.composite });
  console.log(`${pass ? '✓ PASS' : '✗ FAIL'} — ${s.name}`);
  console.log(`  expected: ${s.expectation}`);
  console.log(`  actual:   recommendation=${r.machine_recommendation}  composite=${r.composite}  reason="${r.reason}"`);
  console.log('');
}

console.log(`\n${scenarios.length - failCount}/${scenarios.length} scenarios passed.`);
fs.rmSync(TMP, { recursive: true, force: true });

// write a machine-readable log for the honest-run report to cite exactly
fs.mkdirSync('reports/generated', { recursive: true });
fs.writeFileSync('reports/generated/gate-behavior-harness-results.json', JSON.stringify({ ran_at: new Date().toISOString(), scenarios: results, fail_count: failCount, total: scenarios.length }, null, 2));

process.exit(failCount > 0 ? 1 : 0);
