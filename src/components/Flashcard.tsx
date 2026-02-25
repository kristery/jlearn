import { useState } from 'preact/hooks';

interface Card {
  japanese: string;
  reading: string;
  romaji: string;
  chinese: string;
}

interface Props {
  cards: Card[];
}

export default function Flashcard({ cards }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const card = cards[currentIndex];
  const total = cards.length;

  const goNext = () => {
    if (currentIndex < total - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 150);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  return (
    <section class="my-10">
      <h2 class="flex items-center gap-2 text-xl font-bold mb-5" style={{ color: '#3D3229' }}>
        <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: '#D4EDDA' }}>🃏</span>
        翻牌練習
      </h2>

      <div class="flex flex-col items-center">
        {/* Card */}
        <div
          class="flip-card w-full max-w-sm cursor-pointer select-none"
          style={{ height: '240px' }}
          onClick={() => setIsFlipped(!isFlipped)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div class={`flip-card-inner relative w-full h-full ${isFlipped ? 'flipped' : ''}`}>
            {/* Front */}
            <div
              class="flip-card-front absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6"
              style={{
                background: 'linear-gradient(135deg, #F0FAF4, #D4EDDA)',
                border: '1px solid rgba(168, 213, 186, 0.5)',
              }}
            >
              <span class="text-4xl font-medium mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#3D3229' }}>
                {card.japanese}
              </span>
              <span class="text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#5BA87A' }}>
                {card.reading}
              </span>
              <span class="text-xs mt-4" style={{ color: '#9B8B7E' }}>點擊翻牌</span>
            </div>
            {/* Back */}
            <div
              class="flip-card-back absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6"
              style={{
                background: 'linear-gradient(135deg, #FFF5F5, #FDE8E8)',
                border: '1px solid rgba(248, 200, 200, 0.5)',
              }}
            >
              <span class="text-3xl font-bold mb-2" style={{ color: '#3D3229' }}>
                {card.chinese}
              </span>
              <span class="text-sm mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#6B5B4E' }}>
                {card.japanese}（{card.reading}）
              </span>
              <span class="text-xs" style={{ color: '#9B8B7E', fontFamily: "'Noto Sans JP', sans-serif" }}>
                {card.romaji}
              </span>
              <span class="text-xs mt-4" style={{ color: '#9B8B7E' }}>點擊翻回</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div class="flex items-center gap-4 mt-6">
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            disabled={currentIndex === 0}
            class="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ background: '#F5F0EB' }}
          >
            <svg class="w-5 h-5" fill="none" stroke="#6B5B4E" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span class="text-sm" style={{ color: '#9B8B7E' }}>
            {currentIndex + 1} / {total}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            disabled={currentIndex === total - 1}
            class="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ background: '#F5F0EB' }}
          >
            <svg class="w-5 h-5" fill="none" stroke="#6B5B4E" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {/* Progress dots */}
        <div class="flex gap-1.5 mt-3">
          {cards.map((_, i) => (
            <div
              key={i}
              class="w-2 h-2 rounded-full transition-colors"
              style={{ background: i === currentIndex ? '#5BA87A' : '#E8DDD4' }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
