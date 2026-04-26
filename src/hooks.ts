import { useRef, useSyncExternalStore } from 'react';
import { store, type State } from './store';

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== 'object' || a === null ||
    typeof b !== 'object' || b === null
  ) {
    return false;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao);
  const bk = Object.keys(bo);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!Object.is(ao[k], bo[k])) return false;
  }
  return true;
}

/**
 * Subscribe a React component to the vanilla store.
 *
 * The selector is called on every store change. When the selected slice is
 * shallow-equal to the previously returned value, the SAME reference is
 * returned, so React's useSyncExternalStore does not trigger a re-render.
 *
 * Without this, selectors returning fresh object literals (e.g.
 * `s => ({ playing: s.id === x })`) would cause an infinite re-render loop
 * because each call returns a new reference.
 */
export function useStore<T = State>(selector?: (s: State) => T): T {
  const cacheRef = useRef<{ value: T; valid: boolean }>({
    value: undefined as unknown as T,
    valid: false,
  });

  // We use a stable getSnapshot via closure over the cacheRef.
  // The selector itself is read from the outer scope on each call.
  const getSnapshot = (): T => {
    const next = selector
      ? selector(store.get())
      : (store.get() as unknown as T);
    if (cacheRef.current.valid && shallowEqual(cacheRef.current.value, next)) {
      return cacheRef.current.value;
    }
    cacheRef.current = { value: next, valid: true };
    return next;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
