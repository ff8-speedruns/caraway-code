/**
 * Caraway mansion code table.
 *
 * The RNG that decides how many poles pass the train window is the same one
 * that decides the mansion code, so counting poles tells you the code.
 */

const DEFAULT_START_INDEX = 350;
const LOOKAHEAD_MARGIN = 10;

/** The field RNG state is 32 bits, so it always shows as 8 hex digits. */
const RNG_STATE_HEX_DIGITS = 8;

/**
 * The window a normal run lands in, and the only one the default search looks
 * at. A pole pattern can coincidentally repeat elsewhere in the stream, so a
 * match far from 350 is mathematically valid but almost certainly the wrong
 * index.
 */
const LIKELY_RANGE = { min: 220, max: 580 };

/**
 * How far the wide search reaches, for working out where a run went when its
 * index fell outside LIKELY_RANGE. A full six-set count still resolves to
 * exactly one index at this width, which is why WIDE_SEARCH_MIN_SETS exists.
 * The pole stream repeats every 2^20 indices, so this has to stay well under
 * that or every pattern gains a duplicate.
 */
const WIDE_RANGE = { min: 0, max: 20000 };

export const POLE_COUNT = 6;

/**
 * RNG calls the game makes between the last pole set and the code: one for the
 * station NPC and two for the escalator. The burst window is offset by this
 * at both ends, so the two uses below have to move together.
 */
const CALLS_BETWEEN_POLES_AND_CODE = 3;

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

  // The full 32-bit states are kept alongside the bytes derived from them, so a
  // router watching the RNG in memory can match an index directly.
  const stateArr = Array.from({ length: to + LOOKAHEAD_MARGIN + 1 }, () => nextRngState());
  const sourceArr = stateArr.map((rngState) => (rngState >> 16) & 255);

  return Array.from({ length: to - from + 1 }, (_, offset) => {
    const idx = from + offset;
    const source = sourceArr[idx];

    // The game clamps the code into range.
    let rawCode = source;
    if (source === 0) rawCode = 1;
    else if (source >= 200) rawCode = source - 199;

    const code = rawCode.toString().padStart(3, '0');

    // Poles per burst is rand(0..255) % 16.
    const polesMinIdx = idx - (POLE_COUNT + CALLS_BETWEEN_POLES_AND_CODE);
    const polesMaxIdx = idx - CALLS_BETWEEN_POLES_AND_CODE;
    const poles = polesMinIdx < 0 ? null : sourceArr.slice(polesMinIdx, polesMaxIdx).map((v) => v % 16);
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
      street = sourceArr[idx + 1] >= 200 && sourceArr[idx + 3] >= 130 ? 'Still' : 'None';
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
      rngState: stateArr[idx].toString(16).padStart(RNG_STATE_HEX_DIGITS, '0').toUpperCase(),
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

const inRange = (range) => (entry) => entry.index >= range.min && entry.index <= range.max;

// One table covers both searches; the default one is just a narrower view of it.
const wideTable = makeCarawayCodeTable(WIDE_RANGE.min, WIDE_RANGE.max);
const entryAt = (index) => wideTable[index - WIDE_RANGE.min] ?? null;

export const codes = wideTable.filter(inRange(LIKELY_RANGE));

/**
 * Counted sets below which a wide search stops being trustworthy - it will
 * return coincidental matches from all over the stream rather than one answer.
 */
export const WIDE_SEARCH_MIN_SETS = 5;

const distinctStates = (field) => [...new Set(codes.map((entry) => entry[field]))].sort();

/**
 * Every NPC state the table can actually produce, read back off the table
 * rather than listed by hand so the reference gallery cannot drift from the
 * logic that assigns them.
 */
export const NPC_STATES = {
  station: distinctStates('station'),
  escalator: distinctStates('escalator'),
  street: distinctStates('street'),
  bus: distinctStates('bus'),
};

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
 * backup code two indices later in case you're one seed off. Likeliest first,
 * which only matters for a wide search - the default one rarely returns more
 * than one.
 *
 * `wide` searches the whole stream instead of the window a normal run lands in.
 */
export function findCode(poleValues, { wide = false } = {}) {
  const pattern = poleValues.filter(Boolean).join('');
  if (!pattern) return [];

  const expression = new RegExp(`${pattern}$`);
  const distanceFromUsualIndex = (entry) => Math.abs(entry.index - DEFAULT_START_INDEX);
  const pool = wide ? wideTable : codes;

  return pool
    .filter((entry) => expression.test(entry.polesHex))
    .sort((a, b) => distanceFromUsualIndex(a) - distanceFromUsualIndex(b))
    .map((entry) => ({
      ...entry,
      backup: entryAt(entry.index + 2),
    }));
}
