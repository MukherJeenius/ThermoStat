/** The draft behind a notes textarea: debounced save, honest status, text never lost (spec 10). */
import { useCallback, useEffect, useRef, useState } from 'react';
import { NotesError, type NoteRecord, type NotesErrorReason, type NotesStore, type NoteSubject } from './store';

export type DraftState =
  | { kind: 'empty' }
  | { kind: 'unsaved' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: string }
  | { kind: 'failed'; reason: NotesErrorReason };

export const DEBOUNCE_MS = 800;

export function statusText(s: DraftState): string {
  switch (s.kind) {
    case 'empty':
      return '';
    case 'unsaved':
      return 'Unsaved changes';
    case 'saving':
      return 'Saving…';
    case 'saved': {
      const d = new Date(s.at);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `Saved on this device · ${hh}:${mm}`;
    }
    case 'failed':
      if (s.reason === 'unavailable') return "Notes can't be saved in this browser. Copy your text before leaving.";
      if (s.reason === 'conflict') return 'This note changed in another tab.';
      return "Couldn't save. Your text is still here.";
  }
}

export function useNoteDraft(store: NotesStore | null, subject: NoteSubject) {
  const [text, setText] = useState('');
  const [state, setState] = useState<DraftState>({ kind: 'empty' });
  const rev = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef('');
  const key = `${subject.kind}:${subject.id}`;

  useEffect(() => {
    // callers key the component by subject, so a new subject starts from fresh state
    let live = true;
    store
      ?.load(subject)
      .then((r) => {
        if (!live || !r) return;
        rev.current = r.revision;
        textRef.current = r.text;
        setText(r.text);
        setState({ kind: 'saved', at: r.updatedAt });
      })
      .catch((e) => live && setState({ kind: 'failed', reason: e instanceof NotesError ? e.reason : 'unknown' }));
    return () => {
      live = false;
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, key]);

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!store) return;
    setState({ kind: 'saving' });
    try {
      const r: NoteRecord = await store.save(subject, textRef.current, rev.current);
      rev.current = r.revision;
      setState({ kind: 'saved', at: r.updatedAt }); // only after the Promise resolves
    } catch (e) {
      setState({ kind: 'failed', reason: e instanceof NotesError ? e.reason : 'unknown' }); // the text stays
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, key]);

  const change = useCallback(
    (v: string) => {
      textRef.current = v;
      setText(v);
      setState({ kind: 'unsaved' });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), DEBOUNCE_MS);
    },
    [save],
  );

  /** Conflict: take the other tab's text, or overwrite it with ours. */
  const loadNewer = useCallback(async () => {
    const r = await store?.load(subject).catch(() => null);
    rev.current = r?.revision ?? null;
    textRef.current = r?.text ?? '';
    setText(textRef.current);
    setState(r ? { kind: 'saved', at: r.updatedAt } : { kind: 'empty' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, key]);
  const keepMine = useCallback(async () => {
    const r = await store?.load(subject).catch(() => null);
    rev.current = r?.revision ?? null;
    await save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, key, save]);

  const dirty = state.kind === 'unsaved' || state.kind === 'failed' || state.kind === 'saving';
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  return { text, state, change, save, loadNewer, keepMine, dirty };
}
