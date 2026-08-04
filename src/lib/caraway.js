/**
 * Caraway mansion code table.
 *
 * The RNG that decides how many poles pass the train window is the same one
 * that decides the mansion code, so counting poles tells you the code.
 *
 * Ported from Brofar's original, based on Julien Busset's and Pingval's work
 * and Amshagar's research.
 */

const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export const OPTIONS = {
  defaultStartIndex: 350,
  searchWidth: 800,
  polesArrSize: 6,
};

/** FF8's field RNG: an LCG with a = 0x41C64E6D, b = 0x3039, m = 2^32. */
class RNG {
  static A = BigInt(0x41c64e6d);
  static B = BigInt(0x3039);
  static M = BigInt(0xffffffff);

  constructor() {
    this.current = 1;
  }

  nextRng() {
    const old = this.current;
    this.current = Number((BigInt(this.current) * RNG.A + RNG.B) & RNG.M);
    return old;
  }
}

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
  const rng = new RNG();
  const margin = 10;
  const size = to + margin;

  const rngStateArr = range(0, size).map(() => rng.nextRng());
  const sourceArr = rngStateArr.map((v) => (v >> 16) & 255);

  return Array.from({ length: to }, (_, idx) => {
    if (idx < from || idx > to) return null;

    const source = sourceArr[idx];

    // The game clamps the code into range.
    let rawCode = source;
    if (source === 0) rawCode = 1;
    else if (source >= 200) rawCode = source - 199;

    const code = rawCode.toString().padStart(3, '0');

    // Poles per burst is rand(0..255) % 16.
    const polesMinIdx = idx - (OPTIONS.polesArrSize + 3);
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
      rngState: rngStateArr[idx].toString(16).padStart(8, '0'),
      source,
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
// offset from center is searchWidth/2 - 1, clamped to 0 on the low end.
const maxOffset = OPTIONS.searchWidth / 2 - 1;
const from = Math.max(0, OPTIONS.defaultStartIndex - maxOffset);
const to = OPTIONS.defaultStartIndex + maxOffset;

export const codes = makeCarawayCodeTable(from, to).filter(Boolean);

/**
 * A pole pattern can coincidentally match an index far from 350 - the point
 * in the table this whole window is centered on, and roughly where this
 * trick actually falls in a real run. A match outside this range is still
 * mathematically valid, but it's almost certainly a coincidental repeat of
 * the same pole pattern elsewhere in the table, not a real code.
 */
export const LIKELY_RANGE = { min: 220, max: 580 };

/**
 * Pole dropdown options: a placeholder, the counts 0-15 (stored as hex, since
 * that is how the pole string is encoded), and `?` for a burst you didn't
 * finish counting, which matches any single value.
 */
export const POLE_OPTIONS = [
  { value: '', label: '-' },
  ...Array.from({ length: 16 }, (_, i) => ({ value: i.toString(16), label: String(i) })),
  { value: '.', label: '?' },
];

/**
 * Finds table entries whose pole burst ends with the counts entered, plus the
 * backup code two indices later in case you're one seed off.
 */
export function findCode(poleValues) {
  const pattern = poleValues.filter(Boolean).join('');
  if (!pattern) return [];

  const expression = new RegExp(`${pattern}$`);

  return codes
    .filter((entry) => expression.test(entry.polesHex))
    .map((entry) => ({
      ...entry,
      backup: codes.find((code) => code.index === entry.index + 2) ?? null,
    }));
}
