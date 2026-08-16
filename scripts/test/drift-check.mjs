#!/usr/bin/env node
// drift-check.mjs — per Ch.4 ("Two Customers"): extract the list of
// shell/npm/node commands from a recipe and from its paired human card and
// compare them. Print any command that appears in one but not the other.
// Does NOT silently reconcile — a maintainer decides which side is correct.
//
//   node scripts/test/drift-check.mjs <recipe.md> <card.md>

import fs from 'node:fs';

const [, , recipePath, cardPath] = process.argv;
if (!recipePath || !cardPath) {
  console.error('Usage: drift-check.mjs <recipe.md> <card.md>');
  process.exit(2);
}

function extractCommands(text) {
  const commands = new Set();
  const fenceRe = /```(?:[a-z]*\n)?([\s\S]*?)```/g;
  let m;
  while ((m = fenceRe.exec(text))) {
    for (const line of m[1].split('\n')) {
      const trimmed = line.trim();
      if (/^(node|npm|python3?|git)\s/.test(trimmed)) {
        commands.add(trimmed.replace(/\s+/g, ' '));
      }
    }
  }
  return commands;
}

const recipeText = fs.readFileSync(recipePath, 'utf8');
const cardText = fs.readFileSync(cardPath, 'utf8');
const recipeCmds = extractCommands(recipeText);
const cardCmds = extractCommands(cardText);

const onlyInRecipe = [...recipeCmds].filter((c) => !cardCmds.has(c));
const onlyInCard = [...cardCmds].filter((c) => !recipeCmds.has(c));

console.log(`Drift check: ${recipePath}  <->  ${cardPath}`);
console.log(`Recipe commands: ${recipeCmds.size}  Card commands: ${cardCmds.size}`);

if (onlyInRecipe.length === 0 && onlyInCard.length === 0) {
  console.log('No drift: every command in the recipe appears in the card, and vice versa.');
  process.exit(0);
}

if (onlyInRecipe.length) {
  console.log('\nIn recipe but NOT in card (card may be stale):');
  for (const c of onlyInRecipe) console.log('  ' + c);
}
if (onlyInCard.length) {
  console.log('\nIn card but NOT in recipe (card may have invented a command):');
  for (const c of onlyInCard) console.log('  ' + c);
}
console.log('\nDo not auto-reconcile. The recipe (executable artifact) is ground truth; fix the card.');
process.exit(1);
