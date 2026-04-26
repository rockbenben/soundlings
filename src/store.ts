export type Lang = 'zh' | 'en';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type Route =
  | 'home'
  | 'search'
  | 'random'
  | 'bedtime'
  | 'mystery'
  | 'settings';

export type State = {
  lang: Lang;
  theme: ThemeMode;
  currentTab: string;
  loopMode: boolean;
  currentLoopId: string | null;
  currentPlayingId: string | null;
  randomRunning: boolean;
  sleepTimerEndsAt: number | null;
  route: Route;
};

type Listener = (s: State) => void;

const PERSIST_KEY = 'soundlings.v1';
const PERSIST_FIELDS = ['lang', 'theme'] as const satisfies readonly (keyof State)[];

const defaultLang = (): Lang =>
  (navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';

type Persisted = Partial<Pick<State, (typeof PERSIST_FIELDS)[number]>>;

function loadPersisted(): Persisted {
  try {
    return JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}') as Persisted;
  } catch {
    return {};
  }
}

const initial = (): State => {
  const persisted = loadPersisted();
  return {
    lang: persisted.lang ?? defaultLang(),
    theme: persisted.theme ?? 'auto',
    currentTab: 'vehicles',
    loopMode: false,
    currentLoopId: null,
    currentPlayingId: null,
    randomRunning: false,
    sleepTimerEndsAt: null,
    route: 'home',
  };
};

function persist(s: State) {
  const slice: Persisted = {};
  for (const k of PERSIST_FIELDS) (slice as Record<string, unknown>)[k] = s[k];
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(slice));
  } catch {
    /* private mode / storage full — ignore */
  }
}

let state: State = initial();
const listeners = new Set<Listener>();
let rafScheduled = false;

function notify() {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    for (const fn of listeners) fn(state);
  });
}

export const store = {
  get: (): State => state,
  set(patch: Partial<State>): void {
    let changed = false;
    // Build a shallow-merged next snapshot so React's useSyncExternalStore sees a new ref.
    const next: State = { ...state };
    for (const k in patch) {
      const key = k as keyof State;
      const value = patch[key];
      if (value === undefined) continue;
      if ((next as Record<string, unknown>)[key] !== value) {
        (next as Record<string, unknown>)[key] = value;
        changed = true;
      }
    }
    if (!changed) return;
    state = next;
    persist(state);
    notify();
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
