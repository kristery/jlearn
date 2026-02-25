#!/usr/bin/env node
/**
 * Comprehensive audit of ALL unit JSON files in src/data/
 * Checks: flashcards, quiz, vocab, dialogue, grammar, culture, general fields,
 *         forbidden names, empty strings, duplicate content, chapters.ts cross-reference.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'src', 'data');
const CHAPTERS_TS = path.join(DATA_DIR, 'chapters.ts');

// ─── Helpers ────────────────────────────────────────────────────────────────

const issues = [];
let totalUnitsChecked = 0;
let totalSectionsChecked = 0;

function addIssue(file, sectionType, problem) {
  issues.push({ file, sectionType, problem });
}

function relPath(absPath) {
  return path.relative(path.join(__dirname), absPath);
}

// Recursively find empty strings in an object, returning paths
function findEmptyStrings(obj, currentPath, results) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    if (obj === '') {
      results.push(currentPath);
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => findEmptyStrings(item, `${currentPath}[${i}]`, results));
    return;
  }
  if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      findEmptyStrings(val, `${currentPath}.${key}`, results);
    }
  }
}

// Recursively find forbidden names
function findForbiddenNames(obj, currentPath, results) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    if (obj.includes('黑木') || obj.includes('黒木')) {
      const matched = obj.includes('黑木') ? '黑木' : '黒木';
      results.push({ path: currentPath, matched });
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => findForbiddenNames(item, `${currentPath}[${i}]`, results));
    return;
  }
  if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      findForbiddenNames(val, `${currentPath}.${key}`, results);
    }
  }
}

// ─── Discover all JSON unit files ───────────────────────────────────────────

function discoverUnitFiles() {
  const files = [];
  const chapters = fs.readdirSync(DATA_DIR).filter(d => /^ch\d+$/.test(d)).sort((a, b) => {
    return parseInt(a.replace('ch', '')) - parseInt(b.replace('ch', ''));
  });

  for (const ch of chapters) {
    const chDir = path.join(DATA_DIR, ch);
    const units = fs.readdirSync(chDir)
      .filter(f => /^unit\d+\.json$/.test(f))
      .sort((a, b) => {
        return parseInt(a.replace('unit', '').replace('.json', '')) - parseInt(b.replace('unit', '').replace('.json', ''));
      });
    for (const u of units) {
      files.push(path.join(chDir, u));
    }
  }
  return files;
}

// ─── Parse chapters.ts for unit references ──────────────────────────────────

function parseChaptersTsRefs() {
  const content = fs.readFileSync(CHAPTERS_TS, 'utf-8');
  // Extract chapter blocks
  const refs = []; // { chapterId, unitId }
  const chapterRegex = /id:\s*(\d+),[\s\S]*?units:\s*\[([\s\S]*?)\]/g;
  let match;
  while ((match = chapterRegex.exec(content)) !== null) {
    const chapterId = parseInt(match[1]);
    const unitsBlock = match[2];
    const unitIdRegex = /id:\s*'(unit\d+)'/g;
    let unitMatch;
    while ((unitMatch = unitIdRegex.exec(unitsBlock)) !== null) {
      refs.push({ chapterId, unitId: unitMatch[1] });
    }
  }
  return refs;
}

// ─── Section validators ─────────────────────────────────────────────────────

function checkVocab(section, filePath, sectionIndex) {
  const prefix = `sections[${sectionIndex}] (vocab "${section.title || ''}")`;
  if (!section.items) {
    addIssue(filePath, 'vocab', `${prefix}: missing "items" array`);
    return;
  }
  if (!Array.isArray(section.items)) {
    addIssue(filePath, 'vocab', `${prefix}: "items" is not an array`);
    return;
  }
  if (section.items.length === 0) {
    addIssue(filePath, 'vocab', `${prefix}: "items" array is empty`);
    return;
  }
  const requiredFields = ['japanese', 'reading', 'romaji', 'chinese', 'example', 'exampleChinese'];
  section.items.forEach((item, i) => {
    for (const field of requiredFields) {
      if (item[field] === undefined || item[field] === null) {
        addIssue(filePath, 'vocab', `${prefix}: items[${i}] missing "${field}" (japanese: "${item.japanese || '?'}")`);
      }
    }
  });
}

function checkDialogue(section, filePath, sectionIndex) {
  const prefix = `sections[${sectionIndex}] (dialogue "${section.title || ''}")`;
  if (!section.scene && section.scene !== '') {
    addIssue(filePath, 'dialogue', `${prefix}: missing "scene"`);
  }
  if (section.scene === '') {
    addIssue(filePath, 'dialogue', `${prefix}: "scene" is an empty string`);
  }
  if (!section.lines) {
    addIssue(filePath, 'dialogue', `${prefix}: missing "lines" array`);
    return;
  }
  if (!Array.isArray(section.lines)) {
    addIssue(filePath, 'dialogue', `${prefix}: "lines" is not an array`);
    return;
  }
  if (section.lines.length === 0) {
    addIssue(filePath, 'dialogue', `${prefix}: "lines" array is empty`);
    return;
  }
  const requiredFields = ['speaker', 'japanese', 'chinese'];
  section.lines.forEach((line, i) => {
    for (const field of requiredFields) {
      if (line[field] === undefined || line[field] === null) {
        addIssue(filePath, 'dialogue', `${prefix}: lines[${i}] missing "${field}"`);
      }
    }
  });
}

function checkGrammar(section, filePath, sectionIndex) {
  const prefix = `sections[${sectionIndex}] (grammar "${section.title || ''}")`;
  if (!section.points) {
    addIssue(filePath, 'grammar', `${prefix}: missing "points" array`);
    return;
  }
  if (!Array.isArray(section.points)) {
    addIssue(filePath, 'grammar', `${prefix}: "points" is not an array`);
    return;
  }
  if (section.points.length === 0) {
    addIssue(filePath, 'grammar', `${prefix}: "points" array is empty`);
    return;
  }
  section.points.forEach((pt, i) => {
    for (const field of ['pattern', 'meaning', 'structure']) {
      if (pt[field] === undefined || pt[field] === null) {
        addIssue(filePath, 'grammar', `${prefix}: points[${i}] missing "${field}" (pattern: "${pt.pattern || '?'}")`);
      }
    }
    if (!pt.examples) {
      addIssue(filePath, 'grammar', `${prefix}: points[${i}] missing "examples" array (pattern: "${pt.pattern || '?'}")`);
    } else if (!Array.isArray(pt.examples) || pt.examples.length === 0) {
      addIssue(filePath, 'grammar', `${prefix}: points[${i}] "examples" is empty or not an array (pattern: "${pt.pattern || '?'}")`);
    }
  });
}

function checkFlashcards(section, filePath, sectionIndex) {
  const prefix = `sections[${sectionIndex}] (flashcards "${section.title || ''}")`;
  if (!section.cards) {
    addIssue(filePath, 'flashcards', `${prefix}: missing "cards" array`);
    return;
  }
  if (!Array.isArray(section.cards)) {
    addIssue(filePath, 'flashcards', `${prefix}: "cards" is not an array`);
    return;
  }
  if (section.cards.length === 0) {
    addIssue(filePath, 'flashcards', `${prefix}: "cards" array is empty`);
    return;
  }

  // Check for front/back fields (old format) vs japanese/reading/romaji/chinese (current format)
  const requiredFields = ['japanese', 'reading', 'romaji', 'chinese'];
  section.cards.forEach((card, i) => {
    // Check if using old format
    if (card.front !== undefined || card.back !== undefined) {
      addIssue(filePath, 'flashcards', `${prefix}: cards[${i}] uses old "front/back" format instead of "japanese/reading/romaji/chinese"`);
    }
    for (const field of requiredFields) {
      if (card[field] === undefined || card[field] === null) {
        addIssue(filePath, 'flashcards', `${prefix}: cards[${i}] missing "${field}" (japanese: "${card.japanese || card.front || '?'}")`);
      }
    }
  });

  // Duplicate check: identical japanese (front) values within same unit
  const fronts = section.cards.map(c => c.japanese || c.front || '').filter(f => f !== '');
  const seen = {};
  for (const f of fronts) {
    if (seen[f]) {
      addIssue(filePath, 'flashcards', `${prefix}: DUPLICATE flashcard front/japanese value: "${f}"`);
    }
    seen[f] = true;
  }
}

function checkQuiz(section, filePath, sectionIndex) {
  const prefix = `sections[${sectionIndex}] (quiz "${section.title || ''}")`;
  if (!section.questions) {
    addIssue(filePath, 'quiz', `${prefix}: missing "questions" array`);
    return;
  }
  if (!Array.isArray(section.questions)) {
    addIssue(filePath, 'quiz', `${prefix}: "questions" is not an array`);
    return;
  }
  if (section.questions.length === 0) {
    addIssue(filePath, 'quiz', `${prefix}: "questions" array is empty`);
    return;
  }
  section.questions.forEach((q, i) => {
    if (!q.question) {
      addIssue(filePath, 'quiz', `${prefix}: questions[${i}] missing "question"`);
    }
    if (!q.options) {
      addIssue(filePath, 'quiz', `${prefix}: questions[${i}] missing "options"`);
    } else if (!Array.isArray(q.options)) {
      addIssue(filePath, 'quiz', `${prefix}: questions[${i}] "options" is not an array`);
    } else if (q.options.length !== 4) {
      addIssue(filePath, 'quiz', `${prefix}: questions[${i}] has ${q.options.length} options (expected 4): "${q.question || '?'}"`);
    }
    if (q.correct === undefined || q.correct === null) {
      addIssue(filePath, 'quiz', `${prefix}: questions[${i}] missing "correct"`);
    } else if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
      addIssue(filePath, 'quiz', `${prefix}: questions[${i}] "correct" is ${q.correct} (expected 0-3): "${q.question || '?'}"`);
    }
    if (!q.explanation) {
      addIssue(filePath, 'quiz', `${prefix}: questions[${i}] missing "explanation": "${q.question || '?'}"`);
    }
  });
}

function checkCulture(section, filePath, sectionIndex) {
  const prefix = `sections[${sectionIndex}] (culture "${section.title || ''}")`;
  if (!section.content && section.content !== '') {
    addIssue(filePath, 'culture', `${prefix}: missing "content"`);
  }
  if (section.content === '') {
    addIssue(filePath, 'culture', `${prefix}: "content" is an empty string`);
  }
}

// ─── Main audit ─────────────────────────────────────────────────────────────

function auditUnit(filePath) {
  const rel = relPath(filePath);
  let data;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(raw);
  } catch (e) {
    addIssue(rel, 'parse', `Failed to parse JSON: ${e.message}`);
    return;
  }

  totalUnitsChecked++;

  // 7. General fields
  for (const field of ['title', 'intro', 'estimatedTime', 'sections']) {
    if (data[field] === undefined || data[field] === null) {
      addIssue(rel, 'general', `Missing top-level field: "${field}"`);
    }
  }
  if (data.title === '') addIssue(rel, 'general', '"title" is an empty string');
  if (data.intro === '') addIssue(rel, 'general', '"intro" is an empty string');
  if (data.estimatedTime === '') addIssue(rel, 'general', '"estimatedTime" is an empty string');

  if (!data.sections || !Array.isArray(data.sections)) {
    addIssue(rel, 'general', '"sections" is missing or not an array — cannot continue checking this unit');
    return;
  }

  if (data.sections.length === 0) {
    addIssue(rel, 'general', '"sections" array is empty');
    return;
  }

  // Track which section types are present
  const sectionTypes = new Set();

  data.sections.forEach((section, idx) => {
    totalSectionsChecked++;
    const sType = section.type;
    sectionTypes.add(sType);

    if (!sType) {
      addIssue(rel, 'general', `sections[${idx}] missing "type"`);
      return;
    }

    switch (sType) {
      case 'vocab':
        checkVocab(section, rel, idx);
        break;
      case 'dialogue':
        checkDialogue(section, rel, idx);
        break;
      case 'grammar':
        checkGrammar(section, rel, idx);
        break;
      case 'flashcards':
        checkFlashcards(section, rel, idx);
        break;
      case 'quiz':
        checkQuiz(section, rel, idx);
        break;
      case 'culture':
        checkCulture(section, rel, idx);
        break;
      default:
        addIssue(rel, 'general', `sections[${idx}] has unknown type: "${sType}"`);
    }
  });

  // Check that essential section types are present
  const requiredSections = ['flashcards', 'quiz', 'vocab', 'dialogue', 'grammar'];
  for (const req of requiredSections) {
    if (!sectionTypes.has(req)) {
      addIssue(rel, 'missing-section', `Unit is missing a "${req}" section`);
    }
  }

  // 8. Forbidden names: 黑木, 黒木
  const forbiddenResults = [];
  findForbiddenNames(data, 'root', forbiddenResults);
  for (const r of forbiddenResults) {
    addIssue(rel, 'forbidden-name', `Found forbidden name "${r.matched}" at ${r.path}`);
  }

  // 9. Empty strings in important fields
  const emptyResults = [];
  findEmptyStrings(data, 'root', emptyResults);
  for (const p of emptyResults) {
    // Filter out fields where empty might be acceptable (we already flagged top-level ones)
    // Report empty strings in section data
    if (p.startsWith('root.sections')) {
      addIssue(rel, 'empty-string', `Empty string at ${p}`);
    }
  }
}

// ─── Cross-reference chapters.ts vs actual files ────────────────────────────

function crossReferenceChapters() {
  console.log('\n' + '='.repeat(80));
  console.log('CROSS-REFERENCE: chapters.ts vs actual JSON files');
  console.log('='.repeat(80));

  const tsRefs = parseChaptersTsRefs();
  const actualFiles = discoverUnitFiles();

  // Build sets
  const tsSet = new Set(tsRefs.map(r => `ch${r.chapterId}/${r.unitId}`));
  const actualSet = new Set(actualFiles.map(f => {
    const parts = f.split(path.sep);
    const ch = parts[parts.length - 2];
    const unit = parts[parts.length - 1].replace('.json', '');
    return `${ch}/${unit}`;
  }));

  let crossIssues = 0;

  // Check: referenced in chapters.ts but missing JSON file
  for (const ref of tsSet) {
    if (!actualSet.has(ref)) {
      console.log(`  [MISSING FILE] ${ref}.json is referenced in chapters.ts but file does not exist!`);
      crossIssues++;
    }
  }

  // Check: JSON file exists but not referenced in chapters.ts
  for (const actual of actualSet) {
    if (!tsSet.has(actual)) {
      console.log(`  [ORPHAN FILE] ${actual}.json exists but is NOT referenced in chapters.ts!`);
      crossIssues++;
    }
  }

  // Summary
  console.log(`\n  chapters.ts references: ${tsSet.size} units`);
  console.log(`  Actual JSON files:      ${actualSet.size} files`);

  if (crossIssues === 0) {
    console.log('  RESULT: PASS -- All references match actual files.');
  } else {
    console.log(`  RESULT: FAIL -- ${crossIssues} cross-reference issue(s) found.`);
  }

  return crossIssues;
}

// ─── Run ────────────────────────────────────────────────────────────────────

console.log('='.repeat(80));
console.log('JLEARN UNIT DATA AUDIT');
console.log('='.repeat(80));
console.log(`Data directory: ${DATA_DIR}`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

const unitFiles = discoverUnitFiles();
console.log(`Discovered ${unitFiles.length} unit JSON files across ch1-ch8.\n`);

for (const f of unitFiles) {
  auditUnit(f);
}

// Cross-reference
const crossIssues = crossReferenceChapters();

// ─── Output issues ──────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(80));
console.log('AUDIT RESULTS');
console.log('='.repeat(80));
console.log(`Total units checked:    ${totalUnitsChecked}`);
console.log(`Total sections checked: ${totalSectionsChecked}`);
console.log(`Total issues found:     ${issues.length}`);
console.log();

if (issues.length === 0 && crossIssues === 0) {
  console.log('ALL CHECKS PASSED. No issues found.');
} else {
  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }

  // Group by issue type for summary
  const bySectionType = {};
  for (const issue of issues) {
    if (!bySectionType[issue.sectionType]) bySectionType[issue.sectionType] = 0;
    bySectionType[issue.sectionType]++;
  }

  console.log('--- Issues by category ---');
  for (const [type, count] of Object.entries(bySectionType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log();

  console.log('--- Detailed issues by file ---');
  for (const [file, fileIssues] of Object.entries(byFile).sort()) {
    console.log(`\n  FILE: ${file} (${fileIssues.length} issue(s))`);
    for (const issue of fileIssues) {
      console.log(`    [${issue.sectionType.toUpperCase()}] ${issue.problem}`);
    }
  }
}

// Final verdict
console.log('\n' + '='.repeat(80));
const totalProblems = issues.length + crossIssues;
if (totalProblems === 0) {
  console.log('VERDICT: PASS');
} else {
  console.log(`VERDICT: FAIL (${totalProblems} total problem(s))`);
}
console.log('='.repeat(80));
