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
const WIDE_MAX_INDEX = 20000;

export const POLE_COUNT = 6;

/** A set can hold 0-15 poles, so a count always fits in one hex digit. */
const POLES_PER_SET = 16;

/**
 * RNG calls the game makes between the last pole set and the code: the station
 * roll and the two escalator rolls. The burst window is offset by this at both
 * ends, so the two uses below have to move together.
 */
const CALLS_BETWEEN_POLES_AND_CODE = 3;

/** Below this, the rolls a code depends on run off the front of the stream. */
const FIRST_COMPLETE_INDEX = POLE_COUNT + CALLS_BETWEEN_POLES_AND_CODE;

/** A code byte at or above this wraps back into the 1-199 the keypad accepts. */
const CODE_WRAP_MIN = 200;
const CODE_WRAP_OFFSET = 199;

/**
 * Thresholds the game compares its 0-255 rolls against when deciding each NPC
 * animation. These come from the pole-skip research rather than from anything
 * derivable here, so they only change if that research does.
 */
const STATION_WALKER_ABSENT_MIN = 100;
const ESCALATOR_CHILD_ABSENT_MIN = 150;
const STREET_WALKERS_ABSENT_MIN = 120;
const STREET_LOITERER_MIN = 200;
const STREET_LOITERER_CONFIRM_MIN = 130;
const DOG_LADY_ABSENT_MIN = 200;
const DOG_LADY_EARLY_MIN = 100;

/**
 * Street and bus both read the roll at index + 1, and both happen to test it
 * against 200.
 */
const BUS_ROLLS_SHIFT_MIN = 200;

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

/** One roll decides whether anybody crosses the platform. */
const stationLabel = (roll) => (roll >= STATION_WALKER_ABSENT_MIN ? 'None' : 'Walk');

/** Each child is decided by its own roll, so all four combinations occur. */
function escalatorLabel(girlIsPresent, boyIsPresent) {
  if (boyIsPresent && girlIsPresent) return 'Boy + Girl';
  if (boyIsPresent) return 'Boy';
  if (girlIsPresent) return 'Girl';
  return 'None';
}

/** Walk is a pair crossing the screen; Still is the one who stands there. */
function streetLabel(roll, confirmRoll) {
  if (roll < STREET_WALKERS_ABSENT_MIN) return 'Walk';
  if (roll >= STREET_LOITERER_MIN && confirmRoll >= STREET_LOITERER_CONFIRM_MIN) return 'Still';
  return 'None';
}

/**
 * Tracks is the dog lady on the caraway guard screen, and the three names say
 * when she turns up relative to the bus. Two rolls vote on how early: both high
 * and she arrives with it, one and she appears as it stops, neither and she only
 * shows as it pulls away.
 */
function dogLadyCue(first, second) {
  const earlyRolls = [first, second].filter((roll) => roll >= DOG_LADY_EARLY_MIN).length;
  if (earlyRolls === 2) return 'Spawn';
  if (earlyRolls === 1) return 'Stop';
  return 'Leave';
}

/**
 * How the rolls around a code index are used, in the order the game makes them:
 *
 *   index - 9 .. index - 4   the six pole sets
 *   index - 3                station
 *   index - 2                escalator girl
 *   index - 1                escalator boy
 *   index                    the code itself
 *   index + 1 .. index + 6   street and bus
 */
function makeCarawayCodeTable(to) {
  // FF8's field RNG: an LCG with a = 0x41C64E6D, b = 0x3039, m = 2^32.
  let state = 1;
  const nextRngState = () => {
    const current = state;
    state = (Math.imul(state, 0x41c64e6d) + 0x3039) >>> 0;
    return current;
  };

  // The full 32-bit states are kept alongside the bytes derived from them, so a
  // router watching the RNG in memory can match an index directly.
  const rngStates = Array.from({ length: to + LOOKAHEAD_MARGIN + 1 }, () => nextRngState());
  const rolls = rngStates.map((rngState) => (rngState >> 16) & 255);

  return Array.from({ length: to + 1 }, (_, index) => {
    const roll = rolls[index];

    let rawCode = roll;
    if (roll === 0) rawCode = 1;
    else if (roll >= CODE_WRAP_MIN) rawCode = roll - CODE_WRAP_OFFSET;

    const code = rawCode.toString().padStart(3, '0');

    // Entries below the first complete index can never match a search, since no
    // non-empty pattern matches their empty pole string.
    const hasFullHistory = index >= FIRST_COMPLETE_INDEX;
    const burstStart = index - FIRST_COMPLETE_INDEX;
    const burstEnd = index - CALLS_BETWEEN_POLES_AND_CODE;

    const poles = hasFullHistory
      ? rolls.slice(burstStart, burstEnd).map((value) => value % POLES_PER_SET)
      : null;
    const polesHex = poles ? poles.map((count) => count.toString(16)).join('') : '';

    // NPC states, useful as confirmation that you're on the right index.
    const station = hasFullHistory ? stationLabel(rolls[index - 3]) : null;
    const escalator = hasFullHistory
      ? escalatorLabel(
          rolls[index - 2] < ESCALATOR_CHILD_ABSENT_MIN,
          rolls[index - 1] < ESCALATOR_CHILD_ABSENT_MIN,
        )
      : null;

    const street = streetLabel(rolls[index + 1], rolls[index + 3]);

    // A high roll at +1 shifts the dog lady's rolls two later in the stream.
    const rollsAreShifted = rolls[index + 1] >= BUS_ROLLS_SHIFT_MIN;
    const dogLadyGate = rolls[index + (rollsAreShifted ? 6 : 4)];
    const dogLadyVoteStart = index + (rollsAreShifted ? 4 : 2);
    const bus =
      dogLadyGate >= DOG_LADY_ABSENT_MIN
        ? 'None'
        : dogLadyCue(rolls[dogLadyVoteStart], rolls[dogLadyVoteStart + 1]);

    return {
      index,
      rngState: rngStates[index].toString(16).padStart(RNG_STATE_HEX_DIGITS, '0').toUpperCase(),
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

// One table covers both searches, indexed from 0 so an entry's index is also
// its position; the default search is just a narrower view of it.
const wideTable = makeCarawayCodeTable(WIDE_MAX_INDEX);

export const codes = wideTable.filter(
  (entry) => entry.index >= LIKELY_RANGE.min && entry.index <= LIKELY_RANGE.max,
);

/**
 * Counted sets below which a wide search stops being trustworthy - it will
 * return coincidental matches from all over the stream rather than one answer.
 */
export const WIDE_SEARCH_MIN_SETS = 5;

/**
 * Pole dropdown options: a placeholder and the counts 0-15, stored as hex
 * since that is how the pole string is encoded.
 */
export const POLE_OPTIONS = [
  { value: '', label: '-' },
  ...Array.from({ length: POLES_PER_SET }, (_, count) => ({
    value: count.toString(16),
    label: String(count),
  })),
];

/**
 * A burst you didn't finish counting. The pole burst is stored as a hex string
 * so a pattern can be matched with a regular expression, which is what lets an
 * unfinished set stand in as the any-character wildcard.
 */
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
      backup: wideTable[entry.index + 2] ?? null,
    }));
}
