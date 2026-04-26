import { useEffect, useRef } from 'react';
import { Card, Button, Space } from 'antd';
import { actions } from '../actions';
import type { Preset } from '../catalog';

type Props = {
  preset: Preset | null;
  anchor: HTMLElement | null;
  onClose: () => void;
};

export default function VariantMenu({ preset, anchor, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!preset) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [preset, onClose]);

  if (!preset || !anchor) return null;

  const rect = anchor.getBoundingClientRect();

  // Position below the anchor, clamped to viewport
  const top = Math.min(rect.bottom + 8, window.innerHeight - 8);
  const left = Math.min(
    Math.max(rect.left, 8),
    window.innerWidth - 8 - 180, // 180 = approximate menu width
  );

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 1050,
        minWidth: 160,
      }}
    >
      <Card size="small" styles={{ body: { padding: '8px' } }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {preset.variants.map((variant, i) => (
            <Button
              key={i}
              block
              onClick={() => {
                void actions.playSound(preset.id, i);
                onClose();
              }}
            >
              {variant.labelSuffix ?? `Variant ${i + 1}`}
            </Button>
          ))}
        </Space>
      </Card>
    </div>
  );
}
