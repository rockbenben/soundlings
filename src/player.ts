type EndedCb = (() => void) | null;

const audio = new Audio();
audio.preload = 'auto';

let endedCb: EndedCb = null;
let currentToken = 0; // disambiguates rapid play() calls

audio.addEventListener('ended', () => {
  if (endedCb) endedCb();
});

export type PlayOptions = { loop?: boolean };

export const player = {
  async play(src: string, { loop = false }: PlayOptions = {}): Promise<void> {
    const token = ++currentToken;
    audio.loop = loop;
    audio.src = src;
    try {
      await audio.play();
    } catch (err) {
      if (token !== currentToken) return;
      console.warn('[player] play failed', src, err);
      throw err;
    }
  },
  async playRaw(src: string, { loop = false }: PlayOptions = {}): Promise<void> {
    const token = ++currentToken;
    audio.loop = loop;
    audio.src = src;
    try {
      await audio.play();
    } catch (err) {
      if (token !== currentToken) return;
      console.warn('[player] playRaw failed', src, err);
    }
  },
  stop(): void {
    currentToken++;
    audio.loop = false;
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    } catch {
      /* ignore */
    }
  },
  setLoop(loop: boolean): void {
    audio.loop = loop;
  },
  isPlaying(): boolean {
    return !audio.paused && !audio.ended && audio.currentTime > 0;
  },
  onEnded(fn: EndedCb): void {
    endedCb = fn;
  },
};
