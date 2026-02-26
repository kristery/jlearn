import { useState, useEffect, useRef } from 'preact/hooks';

interface SearchEntry {
  chapterId: number;
  chapterTitle: string;
  unitId: string;
  unitTitle: string;
  type: 'vocab' | 'grammar' | 'dialogue';
  text: string;
  preview: string;
}

interface Props {
  index: SearchEntry[];
  baseUrl: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  vocab: { label: '單字', color: '#5BA87A' },
  grammar: { label: '文法', color: '#D4737D' },
  dialogue: { label: '對話', color: '#D4A853' },
};

interface GroupedResult {
  chapterId: number;
  chapterTitle: string;
  unitId: string;
  unitTitle: string;
  matches: { type: string; preview: string }[];
}

export default function Search({ index, baseUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
  }, [isOpen]);

  const results: GroupedResult[] = [];
  if (query.length >= 1) {
    const q = query.toLowerCase();
    const matched = index.filter((e) => e.text.includes(q));
    const grouped = new Map<string, GroupedResult>();

    for (const m of matched) {
      const key = `${m.chapterId}-${m.unitId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          chapterId: m.chapterId,
          chapterTitle: m.chapterTitle,
          unitId: m.unitId,
          unitTitle: m.unitTitle,
          matches: [],
        });
      }
      const group = grouped.get(key)!;
      if (group.matches.length < 3) {
        group.matches.push({ type: m.type, preview: m.preview });
      }
    }

    results.push(...grouped.values());
  }

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        class="p-2 rounded-xl hover:bg-warm-100 transition-colors"
        aria-label="搜尋"
        title="搜尋 (Ctrl+K)"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B5B4E' }}>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          class="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
          style={{ background: 'rgba(61, 50, 41, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div
            class="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#FEFCFB', border: '1px solid rgba(232, 221, 212, 0.5)', maxHeight: '70vh' }}
          >
            {/* Search input */}
            <div class="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #F5F0EB' }}>
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="#9B8B7E" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="搜尋單字、文法、對話..."
                value={query}
                onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                class="flex-1 text-sm outline-none bg-transparent"
                style={{ color: '#3D3229' }}
              />
              <kbd
                class="hidden sm:inline-block text-xs px-1.5 py-0.5 rounded"
                style={{ background: '#F5F0EB', color: '#9B8B7E' }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div class="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 64px)' }}>
              {query.length === 0 && (
                <div class="px-5 py-8 text-center" style={{ color: '#9B8B7E' }}>
                  <p class="text-sm">輸入關鍵字搜尋所有單元內容</p>
                  <p class="text-xs mt-1">例如：一人、すみません、退稅</p>
                </div>
              )}

              {query.length >= 1 && results.length === 0 && (
                <div class="px-5 py-8 text-center" style={{ color: '#9B8B7E' }}>
                  <p class="text-sm">找不到「{query}」相關的內容</p>
                </div>
              )}

              {results.length > 0 && (
                <div class="py-2">
                  {results.slice(0, 20).map((group) => (
                    <a
                      href={`${baseUrl}chapters/${group.chapterId}/${group.unitId}`}
                      class="block px-5 py-3 transition-colors"
                      style={{ ':hover': {} }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F0EB'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                      onClick={() => setIsOpen(false)}
                    >
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-medium" style={{ color: '#5BA87A' }}>
                          第{group.chapterId}章
                        </span>
                        <svg class="w-3 h-3" fill="none" stroke="#9B8B7E" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span class="text-xs font-medium" style={{ color: '#3D3229' }}>
                          {group.unitTitle}
                        </span>
                      </div>
                      <div class="space-y-1">
                        {group.matches.map((m) => {
                          const t = typeLabels[m.type] || typeLabels.vocab;
                          return (
                            <div class="flex items-start gap-2">
                              <span
                                class="text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                                style={{ background: `${t.color}15`, color: t.color }}
                              >
                                {t.label}
                              </span>
                              <span class="text-xs" style={{ color: '#6B5B4E' }}>
                                {m.preview.length > 60 ? m.preview.substring(0, 60) + '...' : m.preview}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </a>
                  ))}
                  {results.length > 20 && (
                    <div class="px-5 py-2 text-center">
                      <span class="text-xs" style={{ color: '#9B8B7E' }}>
                        還有 {results.length - 20} 個結果，請輸入更精確的關鍵字
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
