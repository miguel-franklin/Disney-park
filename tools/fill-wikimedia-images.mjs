#!/usr/bin/env node
/**
 * Fills attraction imageUrls from Wikimedia Commons (real park / ride photos).
 * Run: npm run images:commons  (from frontend/)
 *
 * Uses categories when available; otherwise scored file search. Filters PDFs/SVGs.
 * https://meta.wikimedia.org/wiki/User-Agent_policy
 */
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const UA = "DisneyParisTravelPlanner/1.0 (private local; https://example.invalid)";

/** Prefer these Commons categories (file namespace); Paris-heavy results sorted by score */
const CATEGORY_BY_ID = {
  "big-thunder-mountain": "Category:Big_Thunder_Mountain_at_Disneyland_Paris",
  "phantom-manor": "Category:Phantom_Manor",
  "pirates-of-the-caribbean": "Category:Pirates_of_the_Caribbean_at_Disneyland_Paris",
  "star-tours": "Category:Star_Tours",
  "buzz-lightyear-laser-blast": "Category:Buzz_Lightyear_Laser_Blast",
  "hyperspace-mountain": "Category:Space_Mountain_at_Disneyland_Paris",
  autopia: "Category:Autopia_at_Disneyland_Paris",
  "its-a-small-world": "Category:It's a small world",
  "mad-hatters-tea-cups": "Category:Mad Tea Party",
  "casey-jr-circus-train": "Category:Casey Jr. Circus Train",
  "snow-white": "Category:Snow White's Scary Adventures",
  "crush-coaster": "Category:Crush's_Coaster",
  "rc-racer": "Category:RC Racer",
};

/** Extra search phrases (after category / default search) */
const EXTRA_SEARCH_BY_ID = {
  "phantom-manor": ["Phantom Manor Disneyland Paris", "Phantom Manor Boot Hill Paris"],
  "indiana-jones": ["Temple of Peril Disneyland Paris", "Indiana Jones Temple Peril DLRP"],
  "peter-pan-flight": ["Peter Pan Flight Disneyland Paris", "Peter Pan Fantasyland Paris"],
  dumbo: ["Dumbo the Flying Elephant Disneyland Paris", "Dumbo Disneyland Paris"],
  pinocchio: ["Les Voyages de Pinocchio Disneyland Paris", "Pinocchio ride Disneyland Paris"],
  "alice-curious-labyrinth": ["Alice Curious Labyrinth Disneyland Paris", "Alice Labyrinth Fantasyland Paris"],
  "storybook-land-canal": [
    "Pays des Contes de Fees Disneyland Paris",
    "Storybook Canal Disneyland Paris",
    "Casey Jr Disneyland Paris canal",
  ],
  "dragon-lair": ["La Tanière du Dragon Disneyland Paris", "Dragon Sleeping Beauty Castle Paris"],
  "main-street-vehicles": ["Main Street Vehicles Disneyland Paris", "Omnibus Disneyland Paris"],
  "tower-of-terror": ["Tower of Terror Disneyland Paris", "Hollywood Tower Hotel Paris Studios"],
  "cars-road-trip": ["Cars Route 66 Disneyland Paris", "Cars Road Trip Walt Disney Studios"],
  "spider-man-web-adventure": ["Avengers Campus Disneyland Paris Spider-Man", "Walt Disney Studios Paris Avengers ride"],
  "avengers-assemble-flight-force": ["Iron Man Coaster Disneyland Paris", "Avengers Campus Paris coaster"],
  "toy-soldiers-parachute-drop": ["Toy Story Playland Parachute Drop Paris"],
  "slinky-dog-zigzag-spin": ["Slinky Dog Zig Zag Spin Disneyland Paris"],
  "cars-quatre-roues-rallye": ["Cars Quatre Roues Rallye Disneyland Paris"],
  "flying-carpets-over-agrabah": ["Flying Carpets Agrabah Walt Disney Studios Paris"],
  "animation-academy": ["Art of Disney Animation Walt Disney Studios Paris"],
  "mickey-and-the-magician": ["Mickey and the Magician Animagique Paris"],
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": UA } }, (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(b));
          } catch (e) {
            reject(new Error(`Bad JSON: ${b.slice(0, 160)}`));
          }
        });
      })
      .on("error", reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function scoreTitle(title) {
  const t = title.toLowerCase().replace(/_/g, " ");
  let s = 0;
  if (
    t.includes("disneyland paris") ||
    t.includes("disneyland_paris") ||
    t.includes("dlrp") ||
    t.includes(" dlp ") ||
    t.startsWith("dlp ") ||
    t.includes("resort paris") ||
    t.includes("euro disney")
  ) {
    s += 25;
  }
  if (t.includes("paris") && t.includes("disney")) s += 10;
  if (t.includes("walt disney studios") && t.includes("paris")) s += 12;
  const penalize = [
    "tokyo",
    "shanghai",
    "hong kong",
    "california",
    "anaheim",
    "orlando",
    "florida",
    "hollywood studios",
    "walt disney world",
    "magic kingdom",
    "/pdf",
  ];
  for (const p of penalize) {
    if (t.includes(p)) s -= 15;
  }
  return s;
}

function isRasterImage(title, mime, url) {
  if (!mime || !mime.startsWith("image/")) return false;
  if (mime === "image/svg+xml") return false;
  const tl = (title || "").toLowerCase();
  if (tl.includes(".pdf") || tl.endsWith(".svg")) return false;
  const u = (url || "").toLowerCase();
  if (u.includes(".pdf")) return false;
  if (/\.svg(\/|$)/i.test(title)) return false;
  return true;
}

async function imageInfosForTitles(titles) {
  if (!titles.length) return [];
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    titles: titles.join("|"),
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "1280",
  });
  const j = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = j.query?.pages ? Object.values(j.query.pages) : [];
  const out = [];
  for (const p of pages) {
    if (p.missing !== undefined) continue;
    const ii = p.imageinfo?.[0];
    const url = ii?.thumburl || ii?.url;
    if (!isRasterImage(p.title, ii?.mime, url)) continue;
    out.push({ title: p.title, url, score: scoreTitle(p.title) });
  }
  return out;
}

async function filesFromCategory(cmtitle, maxFiles = 80) {
  const titles = [];
  let cmcontinue;
  do {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      list: "categorymembers",
      cmtitle,
      cmtype: "file",
      cmlimit: "500",
    });
    if (cmcontinue) params.set("cmcontinue", cmcontinue);
    const j = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
    const batch = j.query?.categorymembers || [];
    for (const m of batch) titles.push(m.title);
    cmcontinue = j.continue?.cmcontinue;
    await sleep(100);
  } while (cmcontinue && titles.length < maxFiles);
  return titles.slice(0, maxFiles);
}

async function urlsFromCategory(cmtitle) {
  const titles = await filesFromCategory(cmtitle);
  const scored = [];
  for (let i = 0; i < titles.length; i += 45) {
    const chunk = titles.slice(i, i + 45);
    const infos = await imageInfosForTitles(chunk);
    scored.push(...infos);
    await sleep(150);
  }
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const urls = [];
  for (const row of scored) {
    if (seen.has(row.url)) continue;
    seen.add(row.url);
    urls.push(row.url);
    if (urls.length >= 3) break;
  }
  return urls;
}

async function urlsFromSearch(query) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "1280",
  });
  const j = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = j.query?.pages ? Object.values(j.query.pages) : [];
  const scored = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const url = ii?.thumburl || ii?.url;
    if (!isRasterImage(p.title, ii?.mime, url)) continue;
    scored.push({ title: p.title, url, score: scoreTitle(p.title) });
  }
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const urls = [];
  for (const row of scored) {
    if (seen.has(row.url)) continue;
    seen.add(row.url);
    urls.push(row.url);
    if (urls.length >= 3) break;
  }
  return urls;
}

function slugSearch(attr) {
  const words = attr.id.split("-").join(" ");
  return `${words} Disneyland Paris`;
}

/** "Disneyland Paris …" often ranks real on-site photos first in Commons search */
function parisPrefixSearch(attr) {
  let short = attr.name.includes(":") ? attr.name.split(":")[0].trim() : attr.name;
  short = short.replace(/'s\b/g, "").replace(/^The\s+/i, "");
  const topic = short.trim();
  if (attr.parkId === "walt-disney-studios-park") {
    return `Walt Disney Studios Paris ${topic}`;
  }
  return `Disneyland Paris ${topic}`;
}

function defaultSearch(attr) {
  const short = attr.name.includes(":") ? attr.name.split(":")[0].trim() : attr.name;
  const q = short.replace(/'/g, " ");
  if (attr.parkId === "walt-disney-studios-park") {
    return `${q} Walt Disney Studios Paris`;
  }
  return `${q} Disneyland Paris`;
}

async function urlsForAttraction(attr) {
  const tried = new Set();
  const merged = [];

  const pushUnique = (arr) => {
    for (const u of arr) {
      if (!u || merged.includes(u)) continue;
      merged.push(u);
    }
  };

  const cat = CATEGORY_BY_ID[attr.id];
  if (cat) {
    try {
      pushUnique(await urlsFromCategory(cat));
    } catch (e) {
      console.error(`  category ${cat}: ${e.message}`);
    }
    await sleep(200);
  }

  const queries = [
    parisPrefixSearch(attr),
    defaultSearch(attr),
    slugSearch(attr),
    ...(EXTRA_SEARCH_BY_ID[attr.id] || []),
  ];
  for (const q of queries) {
    if (merged.length >= 3) break;
    if (tried.has(q)) continue;
    tried.add(q);
    try {
      pushUnique(await urlsFromSearch(q));
    } catch (e) {
      console.error(`  search "${q}": ${e.message}`);
    }
    await sleep(250);
  }

  return merged.slice(0, 3);
}

async function processFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  const list = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let i = 0;
  for (const attr of list) {
    process.stderr.write(`[${++i}/${list.length}] ${attr.id}\n`);
    const urls = await urlsForAttraction(attr);
    if (urls.length === 0) {
      process.stderr.write(`  (no images — leaving existing)\n`);
    } else {
      while (urls.length < 3 && attr.media.imageUrls?.length) {
        const fallback = attr.media.imageUrls.find((u) => !u.includes("source.unsplash.com") && urls.every((x) => x !== u));
        if (!fallback) break;
        urls.push(fallback);
      }
      attr.media.imageUrls = urls;
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2) + "\n", "utf8");
  process.stderr.write(`Wrote ${filePath}\n`);
}

await processFile("frontend/src/data/parks/disneylandPark.json");
await processFile("frontend/src/data/parks/waltDisneyStudiosPark.json");
