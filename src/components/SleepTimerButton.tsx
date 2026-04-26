import { useEffect, useState } from 'react';
import { Button, Dropdown, Badge } from 'antd';
import { useStore } from '../hooks';
import { actions } from '../actions';

type Props = {
  tr: (key: string) => string;
};

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function SleepTimerButton({ tr }: Props) {
  const sleepTimerEndsAt = useStore((s) => s.sleepTimerEndsAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (sleepTimerEndsAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sleepTimerEndsAt]);

  const remainingSeconds =
    sleepTimerEndsAt !== null
      ? Math.max(0, Math.ceil((sleepTimerEndsAt - now) / 1000))
      : null;

  const countdownLabel =
    remainingSeconds !== null ? formatMmSs(remainingSeconds) : null;

  const menuItems = [
    {
      key: 'off',
      label: tr('sleep.off'),
      onClick: () => actions.cancelSleepTimer(),
    },
    {
      key: '5',
      label: tr('sleep.5min'),
      onClick: () => actions.startSleepTimer(5 * 60 * 1000),
    },
    {
      key: '15',
      label: tr('sleep.15min'),
      onClick: () => actions.startSleepTimer(15 * 60 * 1000),
    },
    {
      key: '30',
      label: tr('sleep.30min'),
      onClick: () => actions.startSleepTimer(30 * 60 * 1000),
    },
    {
      key: '60',
      label: tr('sleep.60min'),
      onClick: () => actions.startSleepTimer(60 * 60 * 1000),
    },
  ];

  const btn = (
    <Button
      shape="circle"
      type={countdownLabel ? 'primary' : 'default'}
      aria-label={tr('label.sleep_timer')}
    >
      ⏲
    </Button>
  );

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      {countdownLabel ? (
        <span aria-hidden="true">
          <Badge
            count={
              <span className="sl-np-countdown" style={{ padding: '0 4px' }}>
                {countdownLabel}
              </span>
            }
            color="#fb923c"
            size="small"
          >
            {btn}
          </Badge>
        </span>
      ) : (
        btn
      )}
    </Dropdown>
  );
}
