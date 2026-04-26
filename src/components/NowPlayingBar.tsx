import { Button } from 'antd';
import { useStore } from '../hooks';
import { actions } from '../actions';
import { iconFor } from '../icons';
import { catalog } from '../catalog';
import SleepTimerButton from './SleepTimerButton';

type Props = {
  tr: (key: string) => string;
};

export default function NowPlayingBar({ tr }: Props) {
  const { id, loopMode, lang } = useStore((s) => ({
    id: s.currentPlayingId,
    loopMode: s.loopMode,
    lang: s.lang,
  }));

  if (!id) return null;

  const preset = catalog.byId(id);
  const label = preset
    ? (preset.labels[lang] ?? preset.labels['en'] ?? preset.id)
    : id;
  const emoji = preset ? iconFor(preset.iconKey) : '🔊';
  const eyebrow = tr('label.now_playing');

  return (
    <div className="sl-now-playing" role="status" aria-live="polite">
      <div className="sl-np-inner">
        <span className="sl-np-emoji" aria-hidden="true">{emoji}</span>
        <div className="sl-np-text">
          <span className="sl-np-eyebrow">{eyebrow}</span>
          <span className="sl-np-label">{label}</span>
        </div>
        <div className="sl-np-actions">
          <Button
            shape="circle"
            type={loopMode ? 'primary' : 'default'}
            onClick={() => actions.toggleLoop()}
            aria-label={tr('label.loop')}
            aria-pressed={loopMode}
          >
            🔁
          </Button>
          <SleepTimerButton tr={tr} />
          <Button
            shape="circle"
            type="primary"
            danger
            onClick={() => actions.stopAll()}
            aria-label={tr('label.stop')}
          >
            ⏹
          </Button>
        </div>
      </div>
    </div>
  );
}
