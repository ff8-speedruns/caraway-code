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
  defaultStartIndex: 350,
  searchWidth: 600,
  polesArrSize: 6
};

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

    let polesHex = polesArr.map(num => num.toString(16)).join('');

    let bus, street, escalator, station = null;

    // Station NPC
    if (idx - 3 >= 0) {
      if (sourceArr[idx - 3] >= 100) {
        station = "None"
      } else {
        station = "Walk";
      }
    }

    // Escalator NPC
    if (idx - 2 >= 0) {
      if (sourceArr[idx - 2] >= 150) {
        if (sourceArr[idx - 1] >= 150) {
          escalator = "None"
        } else {
          escalator = "Boy"
        }
      } else {
        if (sourceArr[idx - 1] >= 150) {
          escalator = "Girl"
        } else {
          escalator = "Boy + Girl"
        }
      }
    }

    // Street NPC
    if (sourceArr[idx + 1] >= 120) {
      if (sourceArr[idx + 1] >= 200) {
        if (sourceArr[idx + 3] >= 130) {
          street = "Still->Walk"
        } else {
          street = "None"
        }
      } else {
        street = "None"
      }
    } else {
      street = "Walk";
    }

    // Bus NPC
    if (sourceArr[idx + 1] >= 200) {
      if (sourceArr[idx + 6] < 200) {
        if (sourceArr[idx + 4] >= 100) {
          if (sourceArr[idx + 5] >= 100) {
            bus = "Spawn";
          } else {
            bus = "Stop";
          };
        } else {
          if (sourceArr[idx + 5] >= 100) {
            bus = "Stop";
          } else {
            bus = "Leave";
          };
        };
      } else {
        bus = "None";
      };
    } else {
      if (sourceArr[idx + 4] < 200) {
        if (sourceArr[idx + 2] >= 100) {
          if (sourceArr[idx + 3] >= 100) {
            bus = "Spawn";
          } else {
            bus = "Stop";
          };
        } else {
          if (sourceArr[idx + 3] >= 100) {
            bus = "Stop";
          } else {
            bus = "Leave";
          };
        };
      } else {
        bus = "None";
      };
    }

    // Input command
    let codeInput = Array.from(code).reverse().map((c) => {
      let [up, down, asIs, open, close] = ["↑", "↓", "-", "[", "]"];

      let n = parseInt(c);
      if (n == 0) return `${open}${asIs}${close}`;
      let direction = n <= 5 ? down : up;
      let count = n <= 5 ? n : 10 - n;
      return `${direction}${count}`
    }).join(", ");

    // RNG State - converted to hex format
    let hexRngState = rngStateArr[idx].toString(16).padStart(8, '0');


    if (idx == 445 || idx == 446 || idx == 447 || idx == 448 || idx == 449 || idx == 450)
      console.log(idx, hexRngState, code, codeInput, polesArr, station, escalator, street, bus);

    // Put it all together
    return {
      index: idx,
      rngState: hexRngState,
      source: source,
      code: code,
      poles: polesArr,
      polesHex: polesHex,
      station: station,
      escalator: escalator,
      street: street,
      bus: bus,
      input: codeInput
    }
  });

  return table;
};

let orderArr = Array.from({ length: option.searchWidth / 2 }, (val, idx) => idx);

let order = orderArr.map(offset => (
  [option.defaultStartIndex + offset, option.defaultStartIndex - offset]
)).flat().filter(idx => idx >= 0);

// Unique values only, please.
order = [...new Set(order)];

let min = Math.min(...order);
let max = Math.max(...order);

// Generate table; remove null values.
const codes = makeCarawayCodeTable(min, max).filter(idx => idx != null);

console.log(codes);
