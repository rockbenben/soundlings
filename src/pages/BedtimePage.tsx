import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { useStore } from '../hooks';
import { actions } from '../actions';
import { catalog } from '../catalog';
import { makeT } from '../i18n';
import SoundCard from '../components/SoundCard';

const TIMER_OPTIONS = [
  { key: 'off', ms: 0, labelKey: 'sleep.off' as const },
  { key: '15', ms: 15 * 60 * 1000, labelKey: 'sleep.15min' as const },
  { key: '30', ms: 30 * 60 * 1000, labelKey: 'sleep.30min' as const },
  { key: '60', ms: 60 * 60 * 1000, labelKey: 'sleep.60min' as const },
];

export default function BedtimePage() {
  const { lang, sleepTimerEndsAt } = useStore((s) => ({
    lang: s.lang,
    sleepTimerEndsAt: s.sleepTimerEndsAt,
  }));
  const tr = makeT(lang);

  // Track which option the user picked so we can highlight only that one.
  const [chosen, setChosen] = useState<string>('off');

  // If the timer expires or is cancelled externally, reset highlight to "off".
  useEffect(() => {
    if (sleepTimerEndsAt === null) setChosen('off');
  }, [sleepTimerEndsAt]);

  const bedtimePresets = catalog
    .all()
    .filter(
      (p) =>
        ['ambience', 'nature'].includes(p.category) &&
        p.variants[0]?.loopable !== false,
    );

  function pick(opt: (typeof TIMER_OPTIONS)[number]) {
    if (opt.ms === 0) {
      actions.cancelSleepTimer();
    } else {
      actions.startSleepTimer(opt.ms);
    }
    setChosen(opt.key);
  }

  return (
    <div className="sl-bedtime">
      <header className="sl-bedtime-head">
        <span className="sl-bedtime-moon" aria-hidden="true">🌙</span>
        <div>
          <h2 className="sl-bedtime-title">{tr('bedtime.title')}</h2>
          <p className="sl-bedtime-hint">{tr('bedtime.hint')}</p>
        </div>
      </header>

      <div className="sl-grid">
        {bedtimePresets.map((preset) => (
          <SoundCard key={preset.id} preset={preset} tr={tr} lang={lang} />
        ))}
      </div>

      <div className="sl-timer-row">
        <span className="sl-timer-label">⏲ {tr('label.sleep_timer')}</span>
        {TIMER_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            type={chosen === opt.key ? 'primary' : 'default'}
            onClick={() => pick(opt)}
            size="large"
            shape="round"
          >
            {tr(opt.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}
