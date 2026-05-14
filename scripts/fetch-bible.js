#!/usr/bin/env node
/**
 * Fetches bilingual Bible chapters (KJV + João Ferreira de Almeida, both public domain)
 * from https://bible-api.com and writes them as JSON files in the format expected by
 * src/services/BibleService.ts.
 *
 * Usage: node scripts/fetch-bible.js [book[:chapter]] ...
 *   node scripts/fetch-bible.js                    # all books, all chapters
 *   node scripts/fetch-bible.js john               # all chapters of John
 *   node scripts/fetch-bible.js john:11 romans:9   # specific chapters
 */

const fs = require('fs');
const path = require('path');

const BOOKS = {
  john:      { name: 'John',      namePt: 'João',       chapters: 21 },
  proverbs:  { name: 'Proverbs',  namePt: 'Provérbios', chapters: 31 },
  romans:    { name: 'Romans',    namePt: 'Romanos',    chapters: 16 },
  galatians: { name: 'Galatians', namePt: 'Gálatas',    chapters: 6  },
};

const TRANSLATION_EN_LABEL = 'KJV (Public Domain)';
const TRANSLATION_PT_LABEL = 'Almeida (Public Domain)';
const OUT_DIR = path.join(__dirname, '..', 'src', 'data', 'bible');
const DELAY_MS = 600;
const MAX_RETRIES = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchChapter(bookSlug, chapter, translation) {
  const url = `https://bible-api.com/${bookSlug}+${chapter}?translation=${translation}`;
  let lastErr;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        const backoff = 2000 * Math.pow(2, attempt);
        console.log(`    (429 on ${bookSlug} ${chapter} ${translation}, backing off ${backoff}ms)`);
        await sleep(backoff);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const json = await res.json();
      if (!Array.isArray(json.verses)) throw new Error(`No verses for ${bookSlug} ${chapter} ${translation}`);
      return json.verses;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES - 1) await sleep(1500);
    }
  }
  throw lastErr ?? new Error(`Failed after ${MAX_RETRIES} attempts: ${url}`);
}

function isAlreadyConverted(bookSlug, chapter) {
  const file = path.join(OUT_DIR, `${bookSlug}_${chapter}.json`);
  if (!fs.existsSync(file)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data.translationEn === TRANSLATION_EN_LABEL && data.translationPt === TRANSLATION_PT_LABEL;
  } catch {
    return false;
  }
}

function cleanText(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

async function buildChapter(bookSlug, chapter) {
  const meta = BOOKS[bookSlug];
  const [enVerses, ptVerses] = await Promise.all([
    fetchChapter(bookSlug, chapter, 'kjv'),
    fetchChapter(bookSlug, chapter, 'almeida'),
  ]);

  const ptByVerse = new Map(ptVerses.map((v) => [v.verse, cleanText(v.text)]));
  const verses = enVerses.map((v) => ({
    verse: v.verse,
    en: cleanText(v.text),
    pt: ptByVerse.get(v.verse) ?? '',
  }));

  const missingPt = verses.filter((v) => !v.pt).length;
  if (missingPt > 0) {
    console.warn(`  ! ${bookSlug} ${chapter}: ${missingPt} verses missing PT text`);
  }

  return {
    book: meta.name,
    bookPt: meta.namePt,
    chapter,
    translationEn: TRANSLATION_EN_LABEL,
    translationPt: TRANSLATION_PT_LABEL,
    verses,
  };
}

function writeChapter(bookSlug, chapter, data) {
  const file = path.join(OUT_DIR, `${bookSlug}_${chapter}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`  ✓ ${path.relative(process.cwd(), file)} (${data.verses.length} verses)`);
}

function parseArgs(argv) {
  if (argv.length === 0) {
    const targets = [];
    for (const [slug, meta] of Object.entries(BOOKS)) {
      for (let c = 1; c <= meta.chapters; c++) targets.push([slug, c]);
    }
    return targets;
  }
  const targets = [];
  for (const arg of argv) {
    const [slug, chapStr] = arg.split(':');
    if (!BOOKS[slug]) throw new Error(`Unknown book: ${slug}`);
    if (chapStr) {
      targets.push([slug, Number(chapStr)]);
    } else {
      for (let c = 1; c <= BOOKS[slug].chapters; c++) targets.push([slug, c]);
    }
  }
  return targets;
}

(async () => {
  const targets = parseArgs(process.argv.slice(2));
  console.log(`Fetching ${targets.length} chapter(s)...`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let failures = 0;
  let skipped = 0;
  for (const [bookSlug, chapter] of targets) {
    if (isAlreadyConverted(bookSlug, chapter)) {
      skipped++;
      continue;
    }
    try {
      const data = await buildChapter(bookSlug, chapter);
      writeChapter(bookSlug, chapter, data);
    } catch (err) {
      failures++;
      console.error(`  ✗ ${bookSlug} ${chapter}: ${err.message}`);
    }
    await sleep(DELAY_MS);
  }
  if (skipped > 0) console.log(`  (${skipped} already converted, skipped)`);

  console.log(`\nDone. ${targets.length - failures}/${targets.length} succeeded.`);
  if (failures > 0) process.exit(1);
})();
