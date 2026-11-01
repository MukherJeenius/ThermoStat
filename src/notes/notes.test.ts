import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalNotesStore, NotesError, type NoteRecord, type NotesStore } from './store';
import { DEBOUNCE_MS, statusText, useNoteDraft } from './useNoteDraft';

const A = { kind: 'recipient' as const, id: 'osm:way/1' };
const B = { kind: 'facility' as const, id: 'hce-downtown-plant' };

class MemoryStorage implements Storage {
  m = new Map<string, string>();
  quota = false;
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    if (this.quota) throw Object.assign(new Error('full'), { name: 'QuotaExceededError' });
    this.m.set(k, v);
  }
}

describe('LocalNotesStore', () => {
  let mem: MemoryStorage;
  let store: LocalNotesStore;
  beforeEach(() => {
    mem = new MemoryStorage();
    store = new LocalNotesStore(() => mem);
  });

  it('round trips a note', async () => {
    const r = await store.save(A, 'call the owner', null);
    expect(r.revision).toBe(1);
    expect((await store.load(A))?.text).toBe('call the owner');
    expect(await store.load(B)).toBeNull();
  });
  it('rejects with unavailable when storage is blocked', async () => {
    const blocked = new LocalNotesStore(() => {
      throw Object.assign(new Error('no'), { name: 'SecurityError' });
    });
    await expect(blocked.save(A, 'x', null)).rejects.toMatchObject({ reason: 'unavailable' });
    await expect(new LocalNotesStore(() => null).load(A)).rejects.toMatchObject({ reason: 'unavailable' });
  });
  it('rejects with quota when storage is full', async () => {
    mem.quota = true;
    await expect(store.save(A, 'x', null)).rejects.toMatchObject({ reason: 'quota' });
  });
  it('rejects with conflict on a stale revision', async () => {
    await store.save(A, 'one', null);
    await store.save(A, 'two', 1); // another tab
    await expect(store.save(A, 'mine', 1)).rejects.toMatchObject({ reason: 'conflict' });
  });
  it('toggles the shortlist', async () => {
    expect(await store.setShortlisted(A, true)).toEqual([A]);
    expect(await store.setShortlisted(B, true)).toEqual([A, B]);
    expect(await store.setShortlisted(A, true)).toEqual([B, A]);
    expect(await store.setShortlisted(B, false)).toEqual([A]);
    expect(await store.shortlist()).toEqual([A]);
  });
  it('clearAll removes only ThermoStat keys', async () => {
    mem.setItem('other', 'keep');
    await store.save(A, 'x', null);
    await store.setShortlisted(A, true);
    await store.clearAll();
    expect([...mem.m.keys()]).toEqual(['other']);
  });
});

describe('useNoteDraft', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function deferredStore() {
    let resolve!: (r: NoteRecord) => void;
    let reject!: (e: unknown) => void;
    const store: NotesStore = {
      load: vi.fn(async () => null),
      save: vi.fn(
        () =>
          new Promise<NoteRecord>((res, rej) => {
            resolve = res;
            reject = rej;
          }),
      ),
      shortlist: vi.fn(async () => []),
      setShortlisted: vi.fn(async () => []),
      clearAll: vi.fn(async () => undefined),
    };
    return { store, resolve: (r: NoteRecord) => resolve(r), reject: (e: unknown) => reject(e) };
  }

  it('debounces saving by 800 ms after typing stops', async () => {
    const { store } = deferredStore();
    const { result } = renderHook(() => useNoteDraft(store, A));
    await act(async () => {});
    act(() => result.current.change('a'));
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS - 100));
    act(() => result.current.change('ab'));
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS - 1));
    expect(store.save).not.toHaveBeenCalled();
    expect(result.current.state.kind).toBe('unsaved');
    act(() => vi.advanceTimersByTime(1));
    expect(store.save).toHaveBeenCalledTimes(1);
    expect(store.save).toHaveBeenCalledWith(A, 'ab', null);
  });
  it('never says Saved before the save resolves', async () => {
    const d = deferredStore();
    const { result } = renderHook(() => useNoteDraft(d.store, A));
    await act(async () => {});
    act(() => result.current.change('hello'));
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));
    expect(result.current.state.kind).toBe('saving');
    expect(statusText(result.current.state)).toBe('Saving…');
    await act(async () => d.resolve({ subject: A, text: 'hello', updatedAt: '2026-11-01T14:02:00', revision: 1 }));
    expect(result.current.state.kind).toBe('saved');
    expect(statusText(result.current.state)).toBe('Saved on this device · 14:02');
  });
  it('keeps the text when a save fails', async () => {
    const d = deferredStore();
    const { result } = renderHook(() => useNoteDraft(d.store, A));
    await act(async () => {});
    act(() => result.current.change('do not lose me'));
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));
    await act(async () => d.reject(new NotesError('quota')));
    expect(result.current.state).toEqual({ kind: 'failed', reason: 'quota' });
    expect(result.current.text).toBe('do not lose me');
    expect(result.current.dirty).toBe(true);
  });
});
