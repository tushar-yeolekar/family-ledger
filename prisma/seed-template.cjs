// // prisma/seed-template.js
// require("dotenv/config");
// const { PrismaClient } = require("@prisma/client");

// const prisma = new PrismaClient();

// /**
//  * Fill this object with your exact output-sheet order.
//  * Each array is TOP-to-BOTTOM rows for that column.
//  * Use 3-digit strings: "005", "128", "000".
//  */
// const TEMPLATE = {
//   top: {
//     "1": ["128", "137", "146", "236", "245", "290", "380", "470", "489", "560", "579", "678", "100", "119", "155", "227", "335", "344", "399", "588", "669", "777"],
//     "2": ["129", "138", "147", "156", "237", "246", "345", "390", "480", "570", "589", "679", "110", "200", "228", "255", "336", "499", "660", "688", "778", "444"],
//     "3": ["120", "139", "148", "157", "268", "247", "256", "346", "490", "580", "670", "689", "166", "229", "300", "337", "355", "445", "499", "779", "788", "111"],
//     "4": ["130", "149", "158", "167", "239", "248", "257", "347", "356", "590", "680", "789", "112", "220", "266", "338", "400", "455", "446", "699", "770", "888"],
//     "5": ["140", "159", "168", "230", "249", "258", "267", "348", "357",  "456", "690", "780", "113", "122", "177", "339", "366", "447", "500", "799", "889", "555"],
//   },
//   bottom: {
//     "6": ["126", "150", "169", "178", "240", "259", "268", "349", "358", "367", "457", "790", "114", "277", "330", "448", "466", "556", "600", "880", "899", "222"],
//     "7": ["124", "160", "179", "250", "269", "278", "340", "359", "368", "458", "467", "890", "115", "133", "188", "223", "377", "449", "557", "566", "700", "999"],
//     "8": ["125", "134", "170", "189", "260", "279", "350", "369", "378", "459", "468", "567", "116", "224", "233", "288", "440", "477", "558", "800", "990", "666"],
//     "9": ["126", "135", "180", "234", "270", "289", "360", "379", "450", "469", "478", "568", "117", "144", "199", "225", "388", "559", "577", "667", "900", "333"],
//     "0": ["127", "136", "145", "190", "280", "235", "370", "389", "460", "479", "569", "578", "118", "226", "299", "244", "334", "488", "550", "668", "677", "000"],
//   },
// };

// async function main() {
//   // OPTIONAL: wipe previous template
//   await prisma.templatePosition.deleteMany({});

//   const rows = [];
//   for (const section of ["top", "bottom"]) {
//     for (const col of Object.keys(TEMPLATE[section])) {
//       const nums = TEMPLATE[section][col];
//       nums.forEach((number, idx) => {
//         rows.push({
//           section,
//           col,
//           row: idx + 1,
//           number,
//         });
//       });
//     }
//   }

//   // Insert
//   if (rows.length === 0) {
//     console.log("No rows in TEMPLATE. Fill TEMPLATE arrays first.");
//     return;
//   }

//   // Validate that numbers exist in Number table
//   const missing = [];
//   for (const r of rows) {
//     const exists = await prisma.number.findUnique({ where: { number: r.number } });
//     if (!exists) missing.push(r.number);
//   }
//   if (missing.length) {
//     console.log("These numbers are not in Number table:", [...new Set(missing)]);
//     return;
//   }

//   await prisma.templatePosition.createMany({ data: rows });
//   console.log("Inserted template positions:", rows.length);
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });


/**
 * prisma/seed-template.cjs
 * Run from project root:
 *   node prisma/seed-template.cjs
 */

require("dotenv/config");

const { PrismaClient } = require("@prisma/client");

// Your adapter package exports THIS name (as you saw)
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing. Check your .env in project root.");
  process.exit(1);
}

// Prisma 7 + SQLite: create adapter using URL (NOT a Database instance)
const adapter = new PrismaBetterSqlite3({ url });

// PrismaClient must be constructed with adapter
const prisma = new PrismaClient({ adapter });
const TEMPLATE = {
  top: {
    "1": ["128", "137", "146", "236", "245", "290", "380", "470", "489", "560", "579", "678", "100", "119", "155", "227", "335", "344", "399", "588", "669", "777"],
    "2": ["129", "138", "147", "156", "237", "246", "345", "390", "480", "570", "589", "679", "110", "200", "228", "255", "336", "499", "660", "688", "778", "444"],
    "3": ["120", "139", "148", "157", "268", "247", "256", "346", "490", "580", "670", "689", "166", "229", "300", "337", "355", "445", "499", "779", "788", "111"],
    "4": ["130", "149", "158", "167", "239", "248", "257", "347", "356", "590", "680", "789", "112", "220", "266", "338", "400", "455", "446", "699", "770", "888"],
    "5": ["140", "159", "168", "230", "249", "258", "267", "348", "357",  "456", "690", "780", "113", "122", "177", "339", "366", "447", "500", "799", "889", "555"],
  },
  bottom: {
    "6": ["126", "150", "169", "178", "240", "259", "268", "349", "358", "367", "457", "790", "114", "277", "330", "448", "466", "556", "600", "880", "899", "222"],
    "7": ["124", "160", "179", "250", "269", "278", "340", "359", "368", "458", "467", "890", "115", "133", "188", "223", "377", "449", "557", "566", "700", "999"],
    "8": ["125", "134", "170", "189", "260", "279", "350", "369", "378", "459", "468", "567", "116", "224", "233", "288", "440", "477", "558", "800", "990", "666"],
    "9": ["126", "135", "180", "234", "270", "289", "360", "379", "450", "469", "478", "568", "117", "144", "199", "225", "388", "559", "577", "667", "900", "333"],
    "0": ["127", "136", "145", "190", "280", "235", "370", "389", "460", "479", "569", "578", "118", "226", "299", "244", "334", "488", "550", "668", "677", "000"],
  },
};

function is3DigitString(s) {
  return typeof s === "string" && /^\d{3}$/.test(s);
}

async function main() {
  // Build rows from TEMPLATE
  const rows = [];
  for (const section of ["top", "bottom"]) {
    for (const col of Object.keys(TEMPLATE[section])) {
      const nums = TEMPLATE[section][col] || [];
      nums.forEach((number, idx) => {
        rows.push({ section, col, row: idx + 1, number });
      });
    }
  }

  if (rows.length === 0) {
    console.log("No rows in TEMPLATE. Fill TEMPLATE arrays first.");
    return;
  }

  // Validate formatting
  const bad = [...new Set(rows.map(r => r.number).filter(n => !is3DigitString(n)))];
  if (bad.length) {
    console.log('Bad number(s). Use 3-digit strings like "005":', bad);
    return;
  }

  // Validate numbers exist
  const uniqueNums = [...new Set(rows.map((r) => r.number))];
  const existing = await prisma.number.findMany({
    where: { number: { in: uniqueNums } },
    select: { number: true },
  });
  const existingSet = new Set(existing.map((x) => x.number));
  const missing = uniqueNums.filter((n) => !existingSet.has(n));

  if (missing.length) {
    console.log("These numbers are NOT in the Number table (add them first):", missing);
    return;
  }

  // Wipe + insert template
  await prisma.templatePosition.deleteMany({});
  await prisma.templatePosition.createMany({ data: rows });

  console.log("Inserted template positions:", rows.length);
  console.log("Done ✅");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });