import { useState } from 'preact/hooks';

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Props {
  questions: Question[];
  unitId?: string;
}

export default function Quiz({ questions, unitId }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);

  const q = questions[currentQ];
  const total = questions.length;

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    if (index === q.correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setShowResult(true);
      if (unitId) {
        try {
          const progress = JSON.parse(localStorage.getItem('jlearn-progress') || '{}');
          progress[unitId] = { completed: true, quizScore: score + (selected === q.correct ? 1 : 0) };
          localStorage.setItem('jlearn-progress', JSON.stringify(progress));
        } catch {}
      }
    }
  };

  const restart = () => {
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setShowResult(false);
    setAnswered(false);
  };

  if (showResult) {
    const finalScore = score;
    const percentage = Math.round((finalScore / total) * 100);
    const emoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪';
    const message = percentage >= 80 ? '太棒了！你掌握得很好！' : percentage >= 60 ? '不錯喔！再複習一下會更好！' : '加油！多練習幾次就會進步的！';

    return (
      <section class="my-10">
        <div class="bg-white rounded-2xl border p-8 text-center max-w-md mx-auto" style={{ borderColor: 'rgba(232, 221, 212, 0.5)' }}>
          <div class="text-5xl mb-4">{emoji}</div>
          <h3 class="text-2xl font-bold mb-2" style={{ color: '#3D3229' }}>測驗完成！</h3>
          <p class="text-lg mb-1" style={{ color: '#6B5B4E' }}>
            你答對了 <strong style={{ color: '#5BA87A' }}>{finalScore}</strong> / {total} 題
          </p>
          <p class="text-sm mb-2" style={{ color: '#9B8B7E' }}>正確率 {percentage}%</p>

          {/* Score bar */}
          <div class="w-full h-3 rounded-full my-4" style={{ background: '#F5F0EB' }}>
            <div
              class="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                background: percentage >= 80 ? '#5BA87A' : percentage >= 60 ? '#D4A853' : '#E85D5D',
              }}
            />
          </div>

          <p class="text-sm mb-6" style={{ color: '#6B5B4E' }}>{message}</p>

          <div class="flex gap-3 justify-center">
            <button
              onClick={restart}
              class="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: '#F5F0EB', color: '#6B5B4E' }}
            >
              重新測驗
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section class="my-10">
      <h2 class="flex items-center gap-2 text-xl font-bold mb-5" style={{ color: '#3D3229' }}>
        <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: '#E8D5F5' }}>🧠</span>
        小測驗
      </h2>

      <div class="bg-white rounded-2xl border p-6 max-w-lg mx-auto" style={{ borderColor: 'rgba(232, 221, 212, 0.5)' }}>
        {/* Progress */}
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-medium" style={{ color: '#9B8B7E' }}>
            題目 {currentQ + 1} / {total}
          </span>
          <div class="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                class="w-2 h-2 rounded-full"
                style={{ background: i < currentQ ? '#5BA87A' : i === currentQ ? '#D4A853' : '#E8DDD4' }}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <h3 class="text-lg font-semibold mb-5" style={{ color: '#3D3229', fontFamily: "'Noto Sans JP', 'Noto Sans TC', sans-serif" }}>
          {q.question}
        </h3>

        {/* Options */}
        <div class="space-y-2.5">
          {q.options.map((opt, i) => {
            let borderColor = 'rgba(232, 221, 212, 0.5)';
            let bgColor = 'white';
            let textColor = '#3D3229';

            if (answered) {
              if (i === q.correct) {
                borderColor = '#5BA87A';
                bgColor = '#F0FAF4';
                textColor = '#3D8B6E';
              } else if (i === selected && i !== q.correct) {
                borderColor = '#E85D5D';
                bgColor = '#FFF5F5';
                textColor = '#E85D5D';
              }
            } else if (i === selected) {
              borderColor = '#D4A853';
              bgColor = '#FFFBF0';
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                class="w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium"
                style={{ borderColor, background: bgColor, color: textColor }}
                disabled={answered}
              >
                <span class="mr-2" style={{ color: '#9B8B7E' }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
                {answered && i === q.correct && <span class="float-right">✅</span>}
                {answered && i === selected && i !== q.correct && <span class="float-right">❌</span>}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered && (
          <div class="mt-4 p-4 rounded-xl text-sm" style={{ background: '#FFFBF0', border: '1px solid rgba(212, 168, 83, 0.3)' }}>
            <p style={{ color: '#6B5B4E' }}>
              <span class="font-semibold" style={{ color: '#D4A853' }}>💡 解說：</span>
              {q.explanation}
            </p>
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button
            onClick={nextQuestion}
            class="mt-4 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: '#5BA87A' }}
          >
            {currentQ < total - 1 ? '下一題 →' : '查看結果'}
          </button>
        )}
      </div>
    </section>
  );
}
