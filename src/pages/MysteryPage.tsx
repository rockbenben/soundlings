import { useState } from 'react';
import { Button } from 'antd';
import { player } from '../player';
import { catalog, type Preset } from '../catalog';
import { iconFor } from '../icons';
import { useStore } from '../hooks';
import { makeT } from '../i18n';

type Round = {
  four: Preset[];
  correct: Preset;
};

function pickFour(): Round {
  const all = catalog.all();
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  const four = shuffled.slice(0, 4);
  const correct = four[Math.floor(Math.random() * four.length)];
  return { four, correct };
}

export default function MysteryPage() {
  const lang = useStore((s) => s.lang);
  const tr = makeT(lang);

  const [{ four, correct }, setRound] = useState<Round>(() => pickFour());
  const [revealed, setRevealed] = useState<{ pickedId: string | null }>({
    pickedId: null,
  });
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const isAnswered = revealed.pickedId !== null;

  function handlePlay() {
    const asset = catalog.primaryAsset(correct);
    if (asset) {
      void player.playRaw(asset);
    }
  }

  function handlePick(preset: Preset) {
    if (isAnswered) return;
    const isRight = preset.id === correct.id;
    setRevealed({ pickedId: preset.id });
    setScore((s) => ({
      correct: s.correct + (isRight ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function handleNext() {
    player.stop();
    setRound(pickFour());
    setRevealed({ pickedId: null });
  }

  const pickedId = revealed.pickedId;
  const isCorrect = pickedId === correct.id;
  const correctLabel = correct.labels[lang] ?? correct.labels.en ?? correct.id;
  const scoreLabel = `${score.correct} / ${score.total}`;
  const scoreAria = tr('mystery.score', { n: score.correct, total: score.total });

  return (
    <div className="sl-mystery-hero">
      <div className="sl-mystery-head">
        <h2 className="sl-mystery-title">🎧 {tr('nav.mystery')}</h2>
        {score.total > 0 && (
          <span className="sl-mystery-score" aria-label={scoreAria}>
            ⭐ {scoreLabel}
          </span>
        )}
      </div>

      <Button
        type="primary"
        size="large"
        onClick={handlePlay}
        className="sl-mystery-play"
      >
        ▶ {tr('mystery.play')}
      </Button>

      <div className="sl-mystery-grid">
        {four.map((preset, i) => {
          let extraClass = '';
          if (isAnswered) {
            if (preset.id === correct.id) extraClass = 'correct';
            else if (preset.id === pickedId) extraClass = 'wrong';
          }
          const labelText = isAnswered
            ? `${iconFor(preset.iconKey)} ${preset.labels[lang] ?? preset.labels.en ?? preset.id}`
            : '❓';
          return (
            <button
              key={preset.id}
              className={`sl-mystery-option${extraClass ? ` ${extraClass}` : ''}`}
              disabled={isAnswered}
              onClick={() => handlePick(preset)}
              aria-label={isAnswered ? labelText : `${tr('mystery.play')} ${i + 1}`}
            >
              {labelText}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" style={{ minHeight: '1.6rem' }}>
        {isAnswered && (
          <span className={`sl-mystery-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? `✅ ${tr('mystery.correct')}` : `❌ ${tr('mystery.wrong')} ${correctLabel}`}
          </span>
        )}
      </div>

      {isAnswered && (
        <Button
          type="primary"
          size="large"
          onClick={handleNext}
          style={{ borderRadius: 999, padding: '0 32px', height: 52, fontWeight: 700 }}
        >
          {tr('mystery.next')} →
        </Button>
      )}
    </div>
  );
}
