import { Button } from 'antd';
import { useStore } from '../hooks';
import { actions } from '../actions';
import { catalog } from '../catalog';
import { iconFor } from '../icons';
import { makeT } from '../i18n';

export default function RandomPage() {
  const { randomRunning, currentPlayingId, lang } = useStore((s) => ({
    randomRunning: s.randomRunning,
    currentPlayingId: s.currentPlayingId,
    lang: s.lang,
  }));
  const tr = makeT(lang);

  const currentPreset = currentPlayingId ? catalog.byId(currentPlayingId) : null;
  const subtitle = tr('random.subtitle');
  const idleHint = tr('random.idle');

  return (
    <div className="sl-random-hero">
      <span
        className={`sl-random-dice${randomRunning ? ' running' : ''}`}
        aria-hidden="true"
      >
        🎲
      </span>
      <div>
        <h2 className="sl-random-title">{tr('nav.random')}</h2>
        <p className="sl-random-sub">{subtitle}</p>
      </div>

      {randomRunning ? (
        <Button
          danger
          size="large"
          className="sl-random-btn sl-random-pulse"
          onClick={() => actions.stopRandom()}
        >
          ⏹ {tr('label.stop')}
        </Button>
      ) : (
        <Button
          type="primary"
          size="large"
          className="sl-random-btn"
          onClick={() => actions.startRandom()}
        >
          ▶ {tr('nav.random')}
        </Button>
      )}

      <div
        className={`sl-random-current${currentPreset ? '' : ' empty'}`}
        aria-live="polite"
      >
        {currentPreset ? (
          <>
            <span className="emoji" aria-hidden="true">{iconFor(currentPreset.iconKey)}</span>
            <span>{currentPreset.labels[lang] ?? currentPreset.labels.en ?? currentPreset.id}</span>
          </>
        ) : (
          <span>{idleHint}</span>
        )}
      </div>
    </div>
  );
}
