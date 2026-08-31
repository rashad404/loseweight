#!/usr/bin/env node
/**
 * Mechanical check of the character rules in docs/EDITORIAL.md.
 *
 * It only judges characters and banned phrases. It cannot judge voice, so a
 * clean run is necessary but not sufficient before publishing.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();

const TARGETS = [
  { dir: 'messages', exts: ['.json'] },
  { dir: '../backend/database/seeders/content', exts: ['.html'] },
  { dir: 'content', exts: ['.md', '.html'] },
  // Guide titles, excerpts and meta descriptions live in the seeder, not just
  // in the article bodies. They are reader-facing copy and get checked too.
  { dir: '../backend/database/seeders', exts: ['.php'] },
];

const BANNED_CHARS = [
  { re: /—/g, name: 'em dash', fix: 'use a comma, period, parentheses, or hyphen' },
  { re: /–/g, name: 'en dash', fix: 'use a hyphen or the word "to"' },
  { re: /[‘’]/g, name: 'curly apostrophe', fix: "use a straight '" },
  { re: /[“”]/g, name: 'curly quote', fix: 'use a straight "' },
  { re: / /g, name: 'non-breaking space', fix: 'use a normal space' },
  { re: /[​-‍﻿]/g, name: 'invisible character', fix: 'delete it' },
  { re: /[←-⇿➔-➿]/g, name: 'arrow', fix: 'write the words' },
  { re: /[✓✔✗✘★☆⚠✨]/g, name: 'checkmark or star', fix: 'write the words' },
  { re: /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F0FF}]/gu, name: 'emoji', fix: 'remove it' },
  { re: /…/g, name: 'ellipsis character', fix: 'use three periods' },
];

// American spellings the guides must use.
const BANNED_WORDS = [
  ['fibre', 'fiber'], ['behaviour', 'behavior'], ['behavioural', 'behavioral'],
  ['programme', 'program'], ['centre', 'center'], ['litre', 'liter'],
  ['metre', 'meter'], ['favour', 'favor'], ['labour', 'labor'],
  ['practise', 'practice (verb)'], ['analyse', 'analyze'], ['organise', 'organize'],
  ['recognise', 'recognize'], ['minimise', 'minimize'], ['maximise', 'maximize'],
  ['emphasise', 'emphasize'], ['normalise', 'normalize'], ['whilst', 'while'],
  ['amongst', 'among'], ['towards', 'toward'],
];

const BANNED_PHRASES = [
  'game-changer', 'game changer', 'unlock', 'revolutionize', 'revolutionise',
  'delve', 'empower', 'navigate the complexities', 'in today\'s world',
  'when it comes to', 'it is important to note', 'moreover', 'furthermore',
  'groundbreaking', 'the bottom line', 'in conclusion', 'look no further',
  'rest assured', 'buckle up', 'dive into', 'a testament to',
];


/**
 * Mixed-script check. A Cyrillic "o" sitting inside a Latin-script Azerbaijani
 * word is invisible to a reader and to spellcheck, but it breaks search and
 * looks machine-generated. Latin and Cyrillic must not share a word.
 */
const LATIN = /\p{Script=Latin}/u;
const CYRILLIC = /\p{Script=Cyrillic}/u;

function mixedScriptWords(text) {
  const words = text.match(/[\p{L}\p{M}]+/gu) ?? [];
  return words.filter((w) => LATIN.test(w) && CYRILLIC.test(w));
}

function walk(dir, exts, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.includes(extname(full))) out.push(full);
  }
  return out;
}

let problems = 0;

for (const target of TARGETS) {
  for (const file of walk(join(ROOT, target.dir), target.exts)) {
    const text = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file);
    const lines = text.split('\n');

    for (const rule of BANNED_CHARS) {
      lines.forEach((line, i) => {
        const matches = line.match(rule.re);
        if (!matches) return;
        problems += matches.length;
        console.log(`${rel}:${i + 1}  ${rule.name} x${matches.length}  (${rule.fix})`);
      });
    }

    const lower = text.toLowerCase();

    for (const [bad, good] of BANNED_WORDS) {
      const re = new RegExp(`\\b${bad}\\b`, 'gi');
      lines.forEach((line, i) => {
        const matches = line.match(re);
        if (!matches) return;
        problems += matches.length;
        console.log(`${rel}:${i + 1}  "${bad}" x${matches.length}  (use "${good}")`);
      });
    }

    lines.forEach((line, i) => {
      for (const word of mixedScriptWords(line)) {
        problems++;
        console.log(`${rel}:${i + 1}  mixed Latin and Cyrillic in "${word}"`);
      }
    });

    for (const phrase of BANNED_PHRASES) {
      if (!lower.includes(phrase)) continue;
      lines.forEach((line, i) => {
        if (!line.toLowerCase().includes(phrase)) return;
        problems++;
        console.log(`${rel}:${i + 1}  banned phrase "${phrase}"`);
      });
    }
  }
}

if (problems === 0) {
  console.log('Copy check passed. Characters and banned phrases are clean.');
  console.log('This does not check voice. Read the page aloud before publishing.');
  process.exit(0);
}

console.log(`\n${problems} problem(s). See docs/EDITORIAL.md.`);
process.exit(1);
