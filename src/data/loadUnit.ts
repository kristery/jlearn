export interface VocabItem {
  japanese: string;
  reading: string;
  romaji: string;
  chinese: string;
  example?: string;
  exampleChinese?: string;
}

export interface DialogueLine {
  speaker: string;
  japanese: string;
  chinese: string;
}

export interface Dialogue {
  scene: string;
  lines: DialogueLine[];
}

export interface GrammarExample {
  japanese: string;
  chinese: string;
}

export interface GrammarPoint {
  pattern: string;
  meaning: string;
  structure: string;
  examples: GrammarExample[];
  note?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface UnitSection {
  type: 'vocab' | 'dialogue' | 'grammar' | 'culture' | 'flashcards' | 'quiz';
  title: string;
  items?: VocabItem[];
  scene?: string;
  lines?: DialogueLine[];
  points?: GrammarPoint[];
  content?: string;
  tips?: string[];
  cards?: VocabItem[];
  questions?: QuizQuestion[];
}

export interface UnitData {
  id: string;
  title: string;
  intro: string;
  estimatedTime: string;
  sections: UnitSection[];
}

const unitModules = import.meta.glob<{ default: UnitData }>('./**/unit*.json', { eager: true });

export function loadUnit(chapterId: number, unitId: string): UnitData | null {
  const key = `./ch${chapterId}/${unitId}.json`;
  const mod = unitModules[key];
  return mod ? mod.default : null;
}

export function getAllUnits(): { chapterId: number; unitId: string; data: UnitData }[] {
  const results: { chapterId: number; unitId: string; data: UnitData }[] = [];
  for (const [key, mod] of Object.entries(unitModules)) {
    const match = key.match(/\.\/ch(\d+)\/(unit\d+)\.json/);
    if (match) {
      results.push({
        chapterId: parseInt(match[1]),
        unitId: match[2],
        data: mod.default,
      });
    }
  }
  return results;
}
