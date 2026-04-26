import { useRef, useCallback } from 'react';
import { useStore } from '../hooks';
import { actions } from '../actions';
import { iconFor } from '../icons';
import type { Preset } from '../catalog';
import type { Lang } from '../store';

type Props = {
  preset: Preset;
  tr: (k: string) => string;
  lang: Lang;
  onLongPress?: (preset: Preset, anchor: HTMLElement) => void;
};

const LONG_PRESS_DELAY = 500;
const MOVE_TOLERANCE = 10;

export default function SoundCard({ preset, lang, onLongPress }: Props) {
  const { playing, looping } = useStore((s) => ({
    playing: s.currentPlayingId === preset.id,
    looping: s.currentLoopId === preset.id,
  }));

  const btnRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFiredRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      longFiredRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        longFiredRef.current = true;
        if (preset.variants.length > 1 && onLongPress && btnRef.current) {
          onLongPress(preset, btnRef.current);
        } else {
          void actions.playSound(preset.id);
        }
      }, LONG_PRESS_DELAY);
    },
    [preset, onLongPress],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!startPosRef.current) return;
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) {
        clearTimer();
      }
    },
    [clearTimer],
  );

  const handlePointerUp = useCallback(() => {
    clearTimer();
    startPosRef.current = null;
  }, [clearTimer]);

  const handlePointerCancel = useCallback(() => {
    clearTimer();
    startPosRef.current = null;
  }, [clearTimer]);

  const handleClick = useCallback(() => {
    if (longFiredRef.current) {
      longFiredRef.current = false;
      return;
    }
    actions.playSound(preset.id).catch(() => {
      const btn = btnRef.current;
      if (!btn) return;
      btn.classList.add('shake');
      setTimeout(() => btn.classList.remove('shake'), 250);
    });
  }, [preset.id]);

  const label = preset.labels[lang] ?? preset.labels['en'] ?? preset.id;

  const classes = ['sl-card', playing ? 'is-playing' : '', looping ? 'is-looping' : '']
    .filter(Boolean)
    .join(' ');

  const hasVariants = preset.variants.length > 1;

  return (
    <button
      ref={btnRef}
      className={classes}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      aria-pressed={playing}
      aria-label={label}
    >
      <span className="sl-eq" aria-hidden="true">
        <span /><span /><span />
      </span>
      <span className="sl-emoji" aria-hidden="true">{iconFor(preset.iconKey)}</span>
      <span className="sl-label">{label}</span>
      {hasVariants && (
        <span className="sl-variants" aria-hidden="true">
          {preset.variants.slice(0, 4).map((_, i) => <i key={i} />)}
        </span>
      )}
    </button>
  );
}
