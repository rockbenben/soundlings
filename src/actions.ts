import { store, type Route } from './store';
import { player } from './player';
import { catalog } from './catalog';

let randomTimer: ReturnType<typeof setTimeout> | null = null;
let sleepTimer: ReturnType<typeof setTimeout> | null = null;
let prevLoopMode = false;

function clearRandomTimer() {
  if (randomTimer) {
    clearTimeout(randomTimer);
    randomTimer = null;
  }
}

function clearSleepTimer() {
  if (sleepTimer) {
    clearTimeout(sleepTimer);
    sleepTimer = null;
  }
}

const MODE_ROUTES = new Set<Route>(['random', 'bedtime', 'mystery']);

export const actions = {
  async playSound(id: string, variantIndex = 0): Promise<void> {
    const preset = catalog.byId(id);
    if (!preset) return;
    const asset = catalog.variantAsset(preset, variantIndex) ?? catalog.primaryAsset(preset);
    if (!asset) return;

    const loop = store.get().loopMode;
    // Update store BEFORE awaiting play so UI highlights immediately.
    store.set({
      currentPlayingId: id,
      currentLoopId: loop ? id : null,
    });

    player.onEnded(() => {
      // Only clear if THIS sound just ended (not because user moved on)
      const s = store.get();
      if (s.currentPlayingId === id && s.currentLoopId !== id) {
        store.set({ currentPlayingId: null });
      }
    });

    try {
      await player.play(asset, { loop });
    } catch {
      // Identity-guard: don't wipe a newer playSound's state
      const s = store.get();
      if (s.currentPlayingId === id) {
        store.set({ currentPlayingId: null, currentLoopId: null });
      }
    }
  },

  stopAll(): void {
    player.stop();
    store.set({ currentPlayingId: null, currentLoopId: null });
  },

  toggleLoop(): void {
    const s = store.get();
    const next = !s.loopMode;
    store.set({ loopMode: next });
    if (s.currentPlayingId) {
      if (next) {
        store.set({ currentLoopId: s.currentPlayingId });
        player.setLoop(true);
      } else {
        player.stop();
        store.set({ currentPlayingId: null, currentLoopId: null });
      }
    }
  },

  navigate(route: Route): void {
    const s = store.get();
    if (s.route === route) return;
    // Clean up the route we're leaving
    if (s.route === 'bedtime' && route !== 'bedtime') actions.exitBedtime();
    if (s.route === 'mystery' && route !== 'mystery') {
      actions.stopAll();
      store.set({
        loopMode: false,
        currentLoopId: null,
        currentPlayingId: null,
        randomRunning: false,
      });
    }
    if (s.route === 'random' && route !== 'random') actions.stopRandom();
    if (MODE_ROUTES.has(route) && route !== 'bedtime') {
      actions.stopRandom();
      actions.stopAll();
    }
    if (route === 'bedtime') {
      actions.enterBedtime();
      return;
    }
    store.set({ route });
  },

  startRandom(): void {
    if (store.get().randomRunning) return;
    store.set({ randomRunning: true });
    const tick = async (): Promise<void> => {
      clearRandomTimer();
      if (!store.get().randomRunning) return;
      const all = catalog.all();
      if (all.length === 0) return;
      const pick = all[Math.floor(Math.random() * all.length)];
      await actions.playSound(pick.id);
      player.onEnded(() => {
        if (store.get().randomRunning) tick();
      });
      randomTimer = setTimeout(() => {
        if (store.get().randomRunning) tick();
      }, 5000);
    };
    tick();
  },

  stopRandom(): void {
    clearRandomTimer();
    if (store.get().randomRunning) {
      store.set({ randomRunning: false });
      actions.stopAll();
    }
  },

  startSleepTimer(ms: number): void {
    clearSleepTimer();
    const endsAt = Date.now() + ms;
    store.set({ sleepTimerEndsAt: endsAt });
    sleepTimer = setTimeout(() => {
      actions.stopAll();
      actions.stopRandom();
      store.set({ sleepTimerEndsAt: null });
    }, ms);
  },

  cancelSleepTimer(): void {
    clearSleepTimer();
    store.set({ sleepTimerEndsAt: null });
  },

  enterBedtime(): void {
    const s = store.get();
    prevLoopMode = s.loopMode;
    actions.stopRandom();
    actions.stopAll();
    store.set({ loopMode: true, route: 'bedtime' });
  },

  exitBedtime(): void {
    actions.stopAll();
    actions.cancelSleepTimer();
    store.set({ loopMode: prevLoopMode });
    prevLoopMode = false;
  },
};
