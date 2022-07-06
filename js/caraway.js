/******** HELPER FUNCTIONS ********/
function range(start, end) {
  return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

function isEven(num) {
  return num % 2 === 0;
}

function ArrayCompare(a, b) {
  a.sort();
  b.sort();
  var i = a.length;
  while (i--) {
    if (a[i] !== b[i]) return false;
  }
  return true
}


let option = {
  // 探索の基準とするindex　RTAで無駄がないと350付近らしい
  defaultStartIndex: 350,

  // Base+カード戦オフセットを中央として、これだけの幅を探索
  searchWidth: 300,

  // 検索順 反転:reverse, 降順:ascending, 昇順:descending, 通常:それ以外
  searchOrder: "reverse",

  // キスカ1ツモ固定かつゼルカなし(カード戦闘数の入力を飛ばす)
  beginningQuistisCardOnly: false,

  // 直前にハードリセットを行う(カード戦闘数の入力を飛ばす)…探索する意味ねえ
  hardwareReset: false,

  // 乱数の消費数が3であるカード戦闘数の範囲(てきとう)
  cardSucc3Range: [1, 2, 3, 4],

  // 電柱のセット数上限
  polesArrSize: 5,
  debug: false,
  language: "ja"
};

/*
// ハードリセットを行うと乱数のインデックスが初期化される
if (option.hardwareReset) option.defaultStartIndex = 8;

// STDIN.getch用
require("io/console");

// ワイルドカードを表すTrueClass的なクラス
class WildCardClass {
  get toS() {
    return "*"
  };

  get inspect() {
    return "*"
  }
};

const WildCard = new WildCardClass;

const NPC_Station_Table = { "1": "none", "2": "walk" };

const NPC_Escalator_Table = {
  "1": "both",
  "2": "boy",
  "3": "girl",
  "4": "none"
};

const NPC_Street_Table = { "1": "walk", "2": "none", "3": "stillWalk" };

const NPC_Bus_Table = {
  "1": "none",
  "2": "appear",
  "3": "stop",
  "4": "leave"
};

// Basically, the number of Kisuka Zelka battles is required
if (ARGV.size < (option.hardwareReset || option.beginningQuistisCardOnly ? 1 : 3)) {
  console.log(`Usage: ${File.basename(__FILE__, ".*")} Qcard Zcard [poles+] [NPCs]
  Qcard number of battles
  Zcard number of battles
  poles The number of utility poles that can be seen through the window at the back of the train (every few seconds)
  NPCs A string consisting of the following values
    station NPC at the bottom right of Delling City Station
  \t\t${NPC_Station_Table.map((k, v) => (
    k + JSON.stringify(v)
  )).join(", ")}
    escalator NPC at the bottom right of the escalator
  \t\t${NPC_Escalator_Table.map((k, v) => (
    k + JSON.stringify(v)
  )).join(", ")}
    street\t NPCs on the road
  \t\t${NPC_Street_Table.map((k, v) => (
    k + JSON.stringify(v)
  )).join(", ")}
    bus\t\t NPC in the lower left in front of the Carway House
  \t\t${NPC_Bus_Table.map((k, v) => (
    k + JSON.stringify(v)
  )).join(", ")}
    If you specify a character other than 0 to 9 (such as "-") for the value of poles ~ bus, any pattern will be matched.
    * "*" Cannot be used because it will be wildcard expanded before Ruby receives it.
  Press any key to continue...
  `);

  STDIN.getch();

  console.log(`e.g.
  ・rnd[353]: code:"178"
    Qcard:1, Zcard:0, poles:[1, 10, 3, 7]
    train:walk, escalator:both, street:walk, bus:leave
      ${File.basename(
    __FILE__,
    ".*"
  )} 1 0 1 10 3 7 2114
    ・If you miss something, replace it with "-".
    If you miss the second set of utility poles and the bus NPC：
        ${File.basename(
    __FILE__,
    ".*"
  )} 1 0 1 - 3 7 211-
    ・poles+ Only or NPCs only can be specified：
        ${File.basename(
    __FILE__,
    ".*"
  )} 1 0 1 10 3 7
        ${File.basename(__FILE__, ".*")} 1 0 2114
  ・rnd[351]: code:"139"
    Qcard:1, Zcard:0, poles:[15, 6, 1, ?],
    train:none, escalator:both, street:walk, bus:stop
    Enter "-" because the 4th set of utility poles cannot be confirmed to the end:
      ${File.basename(
    __FILE__,
    ".*"
  )} 1 0 15 6 1 - 1113
  `);

  let exit
};

if (option.debug) console.log(`option\t${option}`);
if (option.debug) console.log(`ARGV\t${ARGV}`);

function strArr2polesArr(strArr) {
  let r = strArr.slice(
    strArr.length - option.polesArrSize,
    strArr.length
  ).map(s => /^\d+\Z/.test(s) ? parseInt(s) : WildCard);

  return [WildCard] * (option.polesArrSize - r.size) + r
};

function str2npcVal(str, hash) {
  let h = hash.clone;
  h.default = WildCard;
  return h[str]
};

// If the string length of the last argument is 4 or more, the last argument is regarded as NPC specification.
let delingNpcs = ARGV[ARGV.length - 1].size < 4 ? "----" : ARGV.pop;

let args_for_search = {
  quistisCard: option.hardwareReset ? 0 : option.beginningQuistisCardOnly ? 1 : parseInt(ARGV.shift),
  zellCard: option.hardwareReset || option.beginningQuistisCardOnly ? 0 : parseInt(ARGV.shift),
  polesArr: strArr2polesArr(ARGV.slice(0)),
  station: str2npcVal(delingNpcs[0], NPC_Station_Table),
  escalator: str2npcVal(delingNpcs[1], NPC_Escalator_Table),
  street: str2npcVal(delingNpcs[2], NPC_Street_Table),
  bus: str2npcVal(delingNpcs[3], NPC_Bus_Table)
};
*/

// below is done
class RNG {
  Initial_State = 0x00000001;

  constructor() {
    this.Current_Rng = 1;
  }

  CreateRand(seed) {
    /**
     * https://en.wikipedia.org/wiki/Linear_congruential_generator
     * FF8's Field RNG is an LCR with:
     * a = 0x41C64E6D = 1103515245
     * b = 0x3039     = 12345
     * m = 0xffffffff = 2^32
     * NewRNG = (OldRNG * a + b) mod m
     **/

    // We use bigints here because JS sucks at large number math
    var a = BigInt(0x41C64E6D);
    var b = BigInt(0x3039);
    var m = BigInt(0xffffffff);

    // https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
    var z = BigInt(seed) || Math.floor(Math.random() * (0xffffffff + 1));
    let rngCalc = (z * a + b) & m;

    // The result is back within the realm of JS being able to handle it, so convert back to a regular number.
    let numValue = Number(rngCalc);
    return numValue;
  }

  NextRng() {
    let oldRng = this.Current_Rng;
    // Progress the RNG for the next call.
    this.Current_Rng = this.CreateRand(this.Current_Rng);
    return oldRng;
  }

  // Random number generation rand(0..32767)
  nxt() {
    return (this.NextRng() >> 16) & 32767
  };

  // Returns the upper 2nd byte of the random number state rand(0..255)
  next_1b() {
    return this.nxt() & 255
  };

}

// Build a table to find the Carway House number
function makeCarawayCodeTable(from, to) {
  let rng = new RNG;

  let margin = 10;

  let size = to + margin;

  let rngStateArr = range(0, size);  //0 - (1015+250)
  rngStateArr = rngStateArr.map(x => rng.NextRng());

  // Random numbers actually used (0..255)
  // >> is a Right shift operand, which shifts the first operand the specified number of bits
  let sourceArr = rngStateArr.map(v => (v >> 16) & 255);


  let table = Array.from({ length: to }, (val, idx) => {
    if (idx < from || idx > to) return null;

    // source
    let source = sourceArr[idx];

    // The code
    let rawCode = source;

    // Game does some logic if the code is out of bounds
    if (source == 0) {
      rawCode = 1;
    } else if (source >= 200) {
      rawCode = source - 199;
    }

    // Format it as a 3-digit 0-padded number
    let code = rawCode.toString().padStart(3, '0');

    // The number of utility poles is rand (0..255)% 16
    let polesMinIdx = idx - (option.polesArrSize + 3);

    let polesArr = (polesMinIdx < 0) ? null : sourceArr.slice(
      polesMinIdx,
      idx - 4 + 1
    ).map(v => v % 16);

    let bus, street, escalator, station = null;

    // Station NPC
    if (idx - 3 >= 0) {
      if (sourceArr[idx - 3] >= 100) {
        station = "none"
      } else {
        station = "walk";
      }
    }

    // Escalator NPC
    if (idx - 2 >= 0) {
      if (sourceArr[idx - 2] >= 150) {
        if (sourceArr[idx - 1] >= 150) {
          escalator = "none"
        } else {
          escalator = "boy"
        }
      } else {
        if (sourceArr[idx - 1] >= 150) {
          escalator = "girl"
        } else {
          escalator = "both"
        }
      }
    }

    // Street NPC
    if (sourceArr[idx + 1] >= 120) {
      if (sourceArr[idx + 1] >= 200) {
        if (sourceArr[idx + 3] >= 130) {
          street = "stillWalk"
        } else {
          street = "none"
        }
      } else {
        street = "none"
      }
    } else {
      street = "walk";
    }

    // Bus NPC
    if (sourceArr[idx + 1] >= 200) {
      if (sourceArr[idx + 6] < 200) {
        if (sourceArr[idx + 4] >= 100) {
          if (sourceArr[idx + 5] >= 100) {
            bus = "appear";
          } else {
            bus = "stop";
          };
        } else {
          if (sourceArr[idx + 5] >= 100) {
            bus = "stop";
          } else {
            bus = "leave";
          };
        };
      } else {
        bus = "none";
      };
    } else {
      if (sourceArr[idx + 4] < 200) {
        if (sourceArr[idx + 2] >= 100) {
          if (sourceArr[idx + 3] >= 100) {
            bus = "appear";
          } else {
            bus = "stop";
          };
        } else {
          if (sourceArr[idx + 3] >= 100) {
            bus = "stop";
          } else {
            bus = "leave";
          };
        };
      } else {
        bus = "none";
      };
    }

    // Input command
    let codeInput = Array.from(code).reverse().map((c) => {
      let [up, down, asIs, open, close] = ["↑", "↓", "-", "[", "]"];

      let n = parseInt(c);
      if (n == 0) return `${c}${open}${asIs}${close}`;
      let direction = n <= 5 ? down : up;
      let count = n <= 5 ? n : 10 - n;
      return `${c}${open}${direction}${count}${close}`
    }).join(", ");

// RNG State - converted to hex format
    let hexRngState = rngStateArr[idx].toString(16);

    
    if(idx == 445 || idx == 446 || idx == 447 || idx == 448 || idx == 449 || idx == 450 )
      console.log(idx, hexRngState, code, codeInput, polesArr,station, escalator, street, bus);

    // Put it all together
    return {
      index: idx,
      rngState: hexRngState,
      source: source,
      code: code,
      poles: polesArr,
      station: station,
      escalator: escalator,
      street: street,
      bus: bus,
      input: codeInput
    }
  });

  return table;
};
/*
function carawayCodeMatch(pattern, codeData) {
  let target = [
    ...codeData.polesArr,
    codeData.station,
    codeData.escalator,
    codeData.street,
    codeData.bus
  ];

  let matchp = pattern.zip(target).every((a, b) => {
    if (b == null) {
      return false
    } else if (a == WildCard) {
      return true
    } else {
      return a == b
    }
  });

  if (matchp || option.debug) {
    let rngState = option.debug ? `${codeData.rngState}→` : "";

    console.log("%s\t[%03d] %s%03d→\"%s\" %s" % [
      matchp ? "*match*" : "",
      codeData.index,
      rngState,
      codeData.source,
      codeData.code,
      target
    ])
  };

  return matchp
};

// Search for the number of the Carway House
function searchCarawayCode({ quistisCard = 1, zellCard = 0, polesArr = [], station = "none", escalator = "none", street = "none", bus = "none" } = {}) {
  // Card battle n-1st time: +3, nth time and after: +6 (actually, it shakes up and down more than this)
  function card2offset(battles) {
    return (1).upto(battles).map(n => option.cardSucc3Range.includes(n) ? 3 : 6).inject("+") || 0
  };

  // Kistis card offset
  let quistisCardOffset = card2offset(quistisCard);

  // Zelcard offset
  let zellCardOffset = card2offset(zellCard);

  // Search start point
  let startIndex = option.defaultStartIndex + quistisCardOffset + zellCardOffset;

  // Search pattern
  let pattern = [...polesArr, station, escalator, street, bus];
  console.log(`pattern = ${pattern}`);

  // Search order (array of indexes)
  let order = ([startIndex] + (1).upto(option.searchWidth / 2).map(offset => (
    [startIndex + offset, startIndex - offset]
  ))).flat(Infinity).filter(idx => idx >= 0);

  switch (option.searchOrder) {
    case "reverse":
      order.reverse;
      break;

    case "ascending":
      order.sort;
      break;

    case "descending":
      order.sort.reverse
  };

  // Build as many tables as you need
  let codeTable = makeCarawayCodeTable(order.min, order.max);

  return order.map((idx) => {
    let codeData = codeTable[idx];

    if (carawayCodeMatch(pattern, codeData)) {
      return { diff: idx - startIndex, index: idx, codeData }
    }
  }).compact
};

function main() {
  console.log(`Quistis card\t${args_for_search.quistisCard} battle(s)
  Zell card\t${args_for_search.zellCard} battle(s)
  poles count\t${args_for_search.polesArr}
  station NPC\t${JSON.stringify(args_for_search.station)}
  ecalator NPC\t${JSON.stringify(args_for_search.escalator)}
  street NPC\t${JSON.stringify(args_for_search.street)}
  bus NPC\t\t${JSON.stringify(args_for_search.bus)}
  
  `);
  let r = searchCarawayCode(args_for_search);
  console.log(`${r.length == 0 ? "not" : r.size} found.`);
  if (r.length == 0) return;
  console.log("");

  // Index closest to the starting point
  let nearestIndex = r.minBy(v => Math.abs(v.diff)).index;
  console.log("diff\tindex\tcode\tinput");

  for (let v of r) {
    let [diff, idx, codeData] = v.values;
    let nearestp = idx == nearestIndex;
    let idxStr = (nearestp ? "*[%03d]*" : "[%03d]") % [idx];

    console.log("%+4d\t%s\t\"%s\"\t%s" % [
      diff,
      idxStr,
      codeData.code,
      codeData.input
    ])
  }
};

main()
*/

let orderArr = Array.from({ length: option.searchWidth / 2 }, (val, idx) => idx);
let order = orderArr.map(offset => (
  [ option.defaultStartIndex + offset,  option.defaultStartIndex - offset]
)).flat().filter(idx => idx >= 0);
// Unique values only, please.
order = [...new Set(order)];

let min = Math.min(...order);
let max = Math.max(...order);

console.log(makeCarawayCodeTable(min, max))