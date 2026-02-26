import { getAllUnits } from './loadUnit';
import { chapters } from './chapters';

export interface SearchEntry {
  chapterId: number;
  chapterTitle: string;
  unitId: string;
  unitTitle: string;
  type: 'vocab' | 'grammar' | 'dialogue';
  text: string;
  preview: string;
}

export function buildSearchIndex(): SearchEntry[] {
  const allUnits = getAllUnits();
  const entries: SearchEntry[] = [];

  for (const { chapterId, unitId, data } of allUnits) {
    const chapter = chapters.find((c) => c.id === chapterId);
    const chapterTitle = chapter?.title || `第${chapterId}章`;
    const unitTitle = data.title;

    for (const section of data.sections) {
      if (section.type === 'vocab' && section.items) {
        for (const item of section.items) {
          entries.push({
            chapterId,
            chapterTitle,
            unitId,
            unitTitle,
            type: 'vocab',
            text: `${item.japanese} ${item.reading} ${item.romaji} ${item.chinese} ${item.example || ''} ${item.exampleChinese || ''}`.toLowerCase(),
            preview: `${item.japanese}（${item.reading}）— ${item.chinese}`,
          });
        }
      }

      if (section.type === 'grammar' && section.points) {
        for (const point of section.points) {
          entries.push({
            chapterId,
            chapterTitle,
            unitId,
            unitTitle,
            type: 'grammar',
            text: `${point.pattern} ${point.meaning} ${point.structure} ${point.note || ''}`.toLowerCase(),
            preview: `${point.pattern} — ${point.meaning}`,
          });
        }
      }

      if (section.type === 'dialogue' && section.lines) {
        for (const line of section.lines) {
          if (line.japanese && line.chinese) {
            entries.push({
              chapterId,
              chapterTitle,
              unitId,
              unitTitle,
              type: 'dialogue',
              text: `${line.japanese} ${line.chinese}`.toLowerCase(),
              preview: `${line.japanese} — ${line.chinese}`,
            });
          }
        }
      }
    }
  }

  return entries;
}
