/**
 * Self-check for the code table. Run with `node src/lib/caraway.check.js`.
 *
 * The burst window sits at fixed offsets before the code index, so an
 * off-by-one there silently shifts every code the tool reports. The absolute
 * anchor below is the only thing that catches that - a round trip alone can't,
 * since shifting poles and code together still round trips.
 */

import assert from 'node:assert/strict';
import { codes, findCode } from './caraway.js';

const ANCHOR = {
  index: 350,
  poles: [9, 8, 12, 15, 6, 1],
  code: '069',
  input: '↑1, ↑4, [-]',
  // Cross-checked against a BigInt recompute of the LCG, so this pins the
  // stream itself, not just this implementation of it.
  rngState: '8145DDAB',
};

const anchor = codes.find((entry) => entry.index === ANCHOR.index);
assert.ok(anchor, `index ${ANCHOR.index} missing from the table`);
assert.equal(anchor.rngState, ANCHOR.rngState, 'RNG stream or seed changed');
assert.deepEqual(anchor.poles, ANCHOR.poles, 'burst window shifted');
assert.equal(anchor.code, ANCHOR.code, 'code offset shifted');
assert.equal(anchor.input, ANCHOR.input, 'keypad input changed');

// The state shown is the one the code is derived from, not a neighbour. Byte 69
// is under the 200 the game clamps at, so it maps straight through to '069'.
const anchorByte = (parseInt(anchor.rngState, 16) >>> 16) & 255;
assert.equal(anchorByte, 69, 'state does not derive the code shown');

// A full six-set count must always find its own index, and only that index.
for (const entry of codes.filter((c) => c.poles)) {
  const results = findCode(entry.poles.map((count) => count.toString(16)));
  if (!results.length) continue; // outside the searched range
  assert.deepEqual(
    results.map((result) => result.index),
    [entry.index],
    `index ${entry.index} did not round trip uniquely`
  );
}

// A wildcard stands in for one unfinished set without dropping the true match.
const wildcarded = ['9', '8', 'c', 'f', '6', '.'];
assert.ok(
  findCode(wildcarded).some((result) => result.index === ANCHOR.index),
  'wildcard lost the true match'
);

// A wide search must reach past the normal window without losing the near match,
// and must still pin a full six-set count to one index.
const anchorPoles = ANCHOR.poles.map((count) => count.toString(16));
assert.deepEqual(
  findCode(anchorPoles, { wide: true }).map((result) => result.index),
  [ANCHOR.index],
  'wide search did not pin a full count'
);

const outsideNormalWindow = ['4', '0', '6', '9', 'd', '9'];
assert.equal(findCode(outsideNormalWindow).length, 0, 'index 767 should be outside the default search');
assert.deepEqual(
  findCode(outsideNormalWindow, { wide: true }).map((result) => result.index),
  [767],
  'wide search did not reach index 767'
);

// Results come back likeliest first, so capping the display keeps the best ones.
const many = findCode(['9'], { wide: true });
assert.ok(many.length > 1, 'a single set should match many indices in a wide search');
const distances = many.map((result) => Math.abs(result.index - 350));
assert.deepEqual(distances, [...distances].sort((a, b) => a - b), 'results are not ordered by likelihood');

console.log('caraway table OK');
