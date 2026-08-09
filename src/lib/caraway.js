/**
 * Caraway mansion code table.
 *
 * The RNG that decides how many poles pass the train window is the same one
 * that decides the mansion code, so counting poles tells you the code.
 */

const DEFAULT_START_INDEX = 350;
const SEARCH_WIDTH = 800;
const LOOKAHEAD_MARGIN = 10;

export const POLE_COUNT = 6;

/** The keypad inputs for a code, entered right to left. */
function codeToInput(code) {
  return Array.from(code)
    .reverse()
    .map((character) => {
      const digit = parseInt(character);
      if (digit === 0) return '[-]';
      const direction = digit <= 5 ? '↓' : '↑';
      const count = digit <= 5 ? digit : 10 - digit;
      return `${direction}${count}`;
    })
    .join(', ');
}

function makeCarawayCodeTable(from, to) {
  // FF8's field RNG: an LCG with a = 0x41C64E6D, b = 0x3039, m = 2^32.
  let state = 1;
  const nextRngState = () => {
    const current = state;
    state = (Math.imul(state, 0x41c64e6d) + 0x3039) >>> 0;
    return current;
  };

  const sourceArr = Array.from(
    { length: to + LOOKAHEAD_MARGIN + 1 },
    () => (nextRngState() >> 16) & 255
  );

  return Array.from({ length: to - from + 1 }, (_, offset) => {
    const idx = from + offset;
    const source = sourceArr[idx];

    // The game clamps the code into range.
    let rawCode = source;
    if (source === 0) rawCode = 1;
    else if (source >= 200) rawCode = source - 199;

    const code = rawCode.toString().padStart(3, '0');

    // Poles per burst is rand(0..255) % 16.
    const polesMinIdx = idx - (POLE_COUNT + 3);
    const poles = polesMinIdx < 0 ? null : sourceArr.slice(polesMinIdx, idx - 3).map((v) => v % 16);
    const polesHex = poles ? poles.map((n) => n.toString(16)).join('') : '';

    // NPC states, useful as confirmation that you're on the right index.
    const station = idx - 3 >= 0 ? (sourceArr[idx - 3] >= 100 ? 'None' : 'Walk') : null;

    let escalator = null;
    if (idx - 2 >= 0) {
      if (sourceArr[idx - 2] >= 150) {
        escalator = sourceArr[idx - 1] >= 150 ? 'None' : 'Boy';
      } else {
        escalator = sourceArr[idx - 1] >= 150 ? 'Girl' : 'Boy + Girl';
      }
    }

    let street;
    if (sourceArr[idx + 1] >= 120) {
      street = sourceArr[idx + 1] >= 200 && sourceArr[idx + 3] >= 130 ? 'Still->Walk' : 'None';
    } else {
      street = 'Walk';
    }

    let bus;
    if (sourceArr[idx + 1] >= 200) {
      if (sourceArr[idx + 6] < 200) {
        if (sourceArr[idx + 4] >= 100) {
          bus = sourceArr[idx + 5] >= 100 ? 'Spawn' : 'Stop';
        } else {
          bus = sourceArr[idx + 5] >= 100 ? 'Stop' : 'Leave';
        }
      } else {
        bus = 'None';
      }
    } else if (sourceArr[idx + 4] < 200) {
      if (sourceArr[idx + 2] >= 100) {
        bus = sourceArr[idx + 3] >= 100 ? 'Spawn' : 'Stop';
      } else {
        bus = sourceArr[idx + 3] >= 100 ? 'Stop' : 'Leave';
      }
    } else {
      bus = 'None';
    }

    return {
      index: idx,
      code,
      poles,
      polesHex,
      station,
      escalator,
      street,
      bus,
      input: codeToInput(code),
    };
  });
}

// Window of indices to build around the usual starting point - the max
// offset from center is SEARCH_WIDTH/2 - 1, clamped to 0 on the low end.
const maxOffset = SEARCH_WIDTH / 2 - 1;

export const codes = makeCarawayCodeTable(
  Math.max(0, DEFAULT_START_INDEX - maxOffset),
  DEFAULT_START_INDEX + maxOffset
);

/**
 * A pole pattern can coincidentally match an index far from 350 - the point
 * in the table this whole window is centered on, and roughly where this
 * trick actually falls in a real run. A match outside this range is still
 * mathematically valid, but it's almost certainly a coincidental repeat of
 * the same pole pattern elsewhere in the table, not a real code.
 */
const LIKELY_RANGE = { min: 220, max: 580 };

/**
 * Pole dropdown options: a placeholder and the counts 0-15, stored as hex
 * since that is how the pole string is encoded.
 */
export const POLE_OPTIONS = [
  { value: '', label: '-' },
  ...Array.from({ length: 16 }, (_, i) => ({ value: i.toString(16), label: String(i) })),
];

/** A burst you didn't finish counting, which matches any single count. */
export const POLE_WILDCARD = '.';

/**
 * Finds table entries whose pole burst ends with the counts entered, plus the
 * backup code two indices later in case you're one seed off.
 */
export function findCode(poleValues) {
  const pattern = poleValues.filter(Boolean).join('');
  if (!pattern) return [];

  const expression = new RegExp(`${pattern}$`);
  const isLikely = (entry) => entry.index >= LIKELY_RANGE.min && entry.index <= LIKELY_RANGE.max;

  return codes
    .filter((entry) => isLikely(entry) && expression.test(entry.polesHex))
    .map((entry) => ({
      ...entry,
      backup: codes.find((code) => code.index === entry.index + 2) ?? null,
    }));
}
