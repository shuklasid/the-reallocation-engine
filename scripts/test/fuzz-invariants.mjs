#!/usr/bin/env node
// fuzz-invariants.mjs — property-based testing for role-scorer.mjs's gate
// behavior. The fixed scenarios in gate-behavior-harness.mjs prove specific,
// hand-picked cases. This file proves something stronger: that two
// INVARIANTS hold across hundreds of RANDOMLY generated inputs, including
// deliberately adversarial ones (negative numbers, out-of-range numbers,
// missing fields, NaN-producing strings, mixed combinations) -- so the
// claim "gates cannot be voted around" doesn't rest on the specific cases
// I happened to think of.
//
//   node scripts/test/fuzz-invariants.mjs [--n 500] [--seed 42]
//
// Invariant 1: gate_product is always in [0, 1] -- never negative, never
//              above 1, regardless of how malformed the input factor is.
// Invariant 2: if gate_product == 0 (any gate closed), the recommendation
//              is ALWAYS 'Skip' -- a closed gate can never be voted around
//              by high sponsorship/fit scores, no matter how high.
// Invariant 3: composite <= vote_sum -- gates can only ever REDUCE the
//              composite relative to the raw votes, never inflate it.
//
// Exit 0 if all invariants hold across every generated case. Exit 1 on the
// first violation found, with the exact failing input printed for
// reproduction.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const nIdx = args.indexOf('--n');
const N = nIdx >= 0 ? parseInt(args[nIdx + 1], 10) : 300;
const seedIdx = args.indexOf('--seed');
let seed = seedIdx >= 0 ? parseInt(args[seedIdx + 1], 10) : 42;

// Deterministic PRNG (mulberry32) so a failure is exactly reproducible with
// the same --seed, rather than depending on Math.random().
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(seed);

// Adversarial pool: deliberately includes values outside the valid [0,1]
// domain, non-numbers, and "missing" (represented by omitting the key).
const ADVERSARIAL_FACTORS = [
  0, 1, 0.5, 0.05, 0.0500001, 0.0499999, -1, -0.5, 2, 1.8, 100,
  Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY,
  'MISSING', // sentinel: omit the field entirely
];

function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }

function randomRole(i) {
  const role = {
    role_id: `fuzz-${i}`,
    company: 'FuzzCo',
    title: 'Fuzz Role',
    sponsorship: { p: rand(), tier: 'Proven', source: 'record' },
    fit: { p: rand(), source: 'model-judgment' },
  };
  const lFactor = pick(ADVERSARIAL_FACTORS);
  const tFactor = pick(ADVERSARIAL_FACTORS);
  if (lFactor !== 'MISSING') role.liveness = { factor: lFactor, source: 'record' };
  if (tFactor !== 'MISSING') role.timeline = { factor: tFactor, source: 'your-input' };
  return role;
}

const SCORER = path.resolve('scripts/score/role-scorer.mjs');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'fuzz-'));

console.log(`Fuzz-testing role-scorer.mjs invariants: N=${N}, seed=${seed}\n`);

let violations = 0;
for (let i = 0; i < N; i++) {
  const role = randomRole(i);
  const fixturePath = path.join(TMP, `r${i}.json`);
  const outDir = path.join(TMP, `r${i}-out`);
  fs.writeFileSync(fixturePath, JSON.stringify([role], null, 2));
  execFileSync('node', [SCORER, fixturePath, '--out-dir', outDir], { stdio: 'pipe' });
  const result = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8')).roles[0];

  const voteSum = result.trace.vote_sum;
  const gateProduct = result.trace.gate_product;
  const composite = result.composite;

  const checks = [
    { name: 'gate_product in [0,1]', ok: gateProduct >= 0 && gateProduct <= 1 },
    { name: 'closed gate implies Skip', ok: !(gateProduct === 0 && result.machine_recommendation !== 'Skip') },
    { name: 'composite <= vote_sum', ok: composite <= voteSum + 1e-9 }, // epsilon for float rounding
  ];

  for (const c of checks) {
    if (!c.ok) {
      violations++;
      console.log(`✗ VIOLATION [${c.name}] on input:`);
      console.log(JSON.stringify(role, null, 2));
      console.log('  result:', JSON.stringify(result, null, 2));
      console.log(`  Reproduce with: --seed ${seed}, case index ${i}\n`);
    }
  }
}

fs.rmSync(TMP, { recursive: true, force: true });

console.log(violations === 0
  ? `✓ All 3 invariants held across ${N} randomly generated inputs (including adversarial values: NaN, Infinity, negative, out-of-range, missing).`
  : `✗ ${violations} invariant violation(s) found across ${N} inputs.`);

fs.mkdirSync('reports/generated', { recursive: true });
fs.writeFileSync('reports/generated/fuzz-invariants-results.json', JSON.stringify({
  ran_at: new Date().toISOString(), n: N, seed, violations,
}, null, 2));

process.exit(violations > 0 ? 1 : 0);
