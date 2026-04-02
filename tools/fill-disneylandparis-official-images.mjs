#!/usr/bin/env node
/**
 * Pull hero/gallery images from official Disneyland Paris attraction pages
 * (seed: https://www.disneylandparis.com/en-usd/attractions/disneyland-park/).
 *
 * The marketing site sends server-side curl to a Queue-it waiting room; this
 * script uses the public text extractor at r.jina.ai to read rendered markdown.
 *
 * Run from repo root: node tools/fill-disneylandparis-official-images.mjs
 * Or: npm run images:dlp-official  (from frontend/)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PAGE_BASE = "https://www.disneylandparis.com/en-usd/attractions/disneyland-park/";
const JINA_PREFIX = "https://r.jina.ai/";

/** Path segment on disneylandparis.com (often differs from our JSON id). */
const SLUG_BY_ID = {
  "indiana-jones": "indiana-jones-and-the-temple-of-peril",
  "star-tours": "star-tours-the-adventures-continue",
  "hyperspace-mountain": "hyperspace-mountain",
  "peter-pan-flight": "peter-pans-flight",
  "snow-white": "blanche-neige-et-les-sept-nains",
  pinocchio: "les-voyages-de-pinocchio",
  dumbo: "dumbo-the-flying-elephant",
  "mad-hatters-tea-cups": "mad-hatters-tea-cups",
  "alice-curious-labyrinth": "alices-curious-labyrinth",
  "casey-jr-circus-train": "casey-jr-le-petit-train-du-cirque",
  "storybook-land-canal": "le-pays-des-contes-de-fees",
  "dragon-lair": "la-taniere-du-dragon",
};

const STOPWORDS = new Set([
  "the",
  "and",
  "with",
  "for",
  "from",
  "les",
  "des",
  "une",
  "pas",
  "aux",
  "dans",
]);

/** Filename hints that are global nav / promos, not the attraction. */
const GENERIC_MARKERS = [
  "megamenu",
  "key-visual-service",
  "premier-access",
  "tourism-market",
  "disney-adventure-world-logo",
  "beauty-shots-corporate",
  "psc-key-visual",
  "calendar-icon",
  "horizontal_hires_rgb",
  "world-of-frozen",
  "eat-and-greet",
  "disneyland-paris-logo",
  "stitch_tcm",
];

const STITCH_PLACEHOLDER = "https://media.disneylandparis.com/d4th/en-usd/images/stitch_tcm1861-159801.jpg";

function significantParts(slug) {
  return slug.split("-").filter((p) => p.length >= 4 && !STOPWORDS.has(p));
}

function partMatchesUrl(u, p) {
  if (p === "star" && u.includes("stitch")) return false;
  return u.includes(p);
}

function hasSlugFragment(url, slug) {
  const u = url.toLowerCase();
  if (u.includes(slug)) return true;
  const parts = slug.split("-");
  for (let i = 0; i < parts.length - 1; i++) {
    const pair = `${parts[i]}-${parts[i + 1]}`;
    if (pair.length >= 6 && u.includes(pair)) return true;
  }
  return false;
}

function urlRelevantToSlug(url, slug) {
  const u = url.toLowerCase();
  if (GENERIC_MARKERS.some((g) => u.includes(g))) return false;
  if (hasSlugFragment(url, slug)) return true;
  if (u.includes(slug)) return true;
  const parts = significantParts(slug);
  if (parts.length === 0) return true;
  const hits = parts.filter((p) => partMatchesUrl(u, p));
  return hits.length >= Math.min(2, parts.length);
}

function normalizeMediaUrl(raw) {
  let u = raw.split("?")[0].trim();
  if (u.endsWith(",")) u = u.slice(0, -1);
  if (!u.startsWith("http")) u = `https://${u}`;
  return u;
}

function extractImageUrls(markdown) {
  const re = /https:\/\/media\.disneylandparis\.com\/d4th\/en-usd\/images\/[^\s\])'"<>]+\.(?:jpg|jpeg|webp)/gi;
  const raw = markdown.match(re) || [];
  const set = new Set();
  for (const r of raw) {
    const n = normalizeMediaUrl(r);
    if (/\.(jpg|jpeg|webp)$/i.test(n)) set.add(n);
  }
  return [...set];
}

function scoreUrl(url, slug) {
  let s = 0;
  const u = url.toLowerCase();
  if (u.includes(slug)) s += 100;
  if (u.includes("detail")) s += 15;
  if (u.includes("attraction")) s += 10;
  if (u.includes("facade") || u.includes("queue")) s += 5;
  const hitn = (u.match(/n\d{4,6}_/g) || []).length;
  if (hitn) s += 5;
  const parts = significantParts(slug);
  for (const p of parts) {
    if (partMatchesUrl(u, p)) s += 12;
  }
  return s;
}

async function fetchMarkdown(pageUrl) {
  const jinaUrl = JINA_PREFIX + encodeURIComponent(pageUrl);
  const res = await fetch(jinaUrl, {
    headers: {
      Accept: "text/plain",
      "X-Return-Format": "markdown",
    },
  });
  if (!res.ok) {
    throw new Error(`Jina ${res.status} for ${pageUrl}`);
  }
  return res.text();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function imagesForSlug(slug) {
  const pageUrl = `${PAGE_BASE}${slug}/`;
  const md = await fetchMarkdown(pageUrl);
  const all = extractImageUrls(md);
  const noPromo = all.filter((u) => !GENERIC_MARKERS.some((g) => u.toLowerCase().includes(g)));
  let pool = noPromo.filter((u) => urlRelevantToSlug(u, slug));
  if (pool.length === 0) {
    pool = noPromo.filter((u) => hasSlugFragment(u, slug));
  }
  if (pool.length === 0) {
    pool = noPromo;
  }
  const scored = pool.map((u) => ({ u, sc: scoreUrl(u, slug) }));
  scored.sort((a, b) => b.sc - a.sc);
  const seen = new Set();
  const out = [];
  for (const { u } of scored) {
    if (seen.has(u)) continue;
    if (!hasSlugFragment(u, slug) && scoreUrl(u, slug) < 40) continue;
    seen.add(u);
    out.push(`${u}?w=1600&f=webp`);
    if (out.length >= 3) break;
  }
  if (out.length === 0) {
    out.push(`${STITCH_PLACEHOLDER}?w=1600&f=webp`);
  }
  return { pageUrl, images: out };
}

async function main() {
  const filePath = path.join(ROOT, "frontend/src/data/parks/disneylandPark.json");
  const list = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let n = 0;
  for (const attr of list) {
    const slug = SLUG_BY_ID[attr.id] ?? attr.id;
    process.stderr.write(`[${++n}/${list.length}] ${attr.id} ← ${slug}\n`);
    try {
      const { pageUrl, images } = await imagesForSlug(slug);
      if (images.length === 0) {
        process.stderr.write(`  no images (see ${pageUrl})\n`);
      } else {
        attr.media.imageUrls = images;
      }
    } catch (e) {
      process.stderr.write(`  ERROR: ${e.message}\n`);
    }
    await sleep(800);
  }
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2) + "\n", "utf8");
  process.stderr.write(`Wrote ${filePath}\n`);
}

await main();
