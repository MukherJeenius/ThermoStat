/** Field notes and the shortlist: private browser state behind one interface (spec 10). */
import { createContext, useContext } from 'react';

export type NoteSubject = { kind: 'facility' | 'recipient'; id: string };
export interface NoteRecord { subject: NoteSubject; text: string; updatedAt: string; revision: number }
export type NotesErrorReason = 'quota' | 'unavailable' | 'conflict' | 'unknown';
export class NotesError extends Error {
  constructor(public reason: NotesErrorReason) {
    super(reason);
  }
}

export interface NotesStore {
  load(subject: NoteSubject): Promise<NoteRecord | null>;
  save(subject: NoteSubject, text: string, baseRevision: number | null): Promise<NoteRecord>; // rejects NotesError
  shortlist(): Promise<NoteSubject[]>;
  setShortlisted(subject: NoteSubject, on: boolean): Promise<NoteSubject[]>;
  clearAll(): Promise<void>;
}

const PREFIX = 'thermostat:v1:';
const noteKey = (s: NoteSubject) => `${PREFIX}note:${s.kind}:${s.id}`;
const LIST_KEY = `${PREFIX}shortlist`;
export const sameSubject = (a: NoteSubject, b: NoteSubject) => a.kind === b.kind && a.id === b.id;

function reasonOf(e: unknown): NotesErrorReason {
  if (e instanceof NotesError) return e.reason;
  const name = (e as { name?: string } | null)?.name ?? '';
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') return 'quota';
  if (name === 'SecurityError') return 'unavailable';
  return 'unknown';
}

/** localStorage, with every call wrapped so a remote store could replace it without changing callers. */
export class LocalNotesStore implements NotesStore {
  constructor(
    private readonly storage: () => Storage | null = () => window.localStorage,
    private readonly writeDelayMs = 0, // test seam: lets the screenshot script capture "Saving…"
  ) {}

  private get(): Storage {
    let s: Storage | null;
    try {
      s = this.storage();
    } catch {
      throw new NotesError('unavailable');
    }
    if (!s) throw new NotesError('unavailable');
    return s;
  }

  private run<T>(fn: (s: Storage) => T): Promise<T> {
    try {
      return Promise.resolve(fn(this.get()));
    } catch (e) {
      return Promise.reject(e instanceof NotesError ? e : new NotesError(reasonOf(e)));
    }
  }

  load(subject: NoteSubject) {
    return this.run((s) => {
      const raw = s.getItem(noteKey(subject));
      if (!raw) return null;
      try {
        return JSON.parse(raw) as NoteRecord;
      } catch {
        return null;
      }
    });
  }

  async save(subject: NoteSubject, text: string, baseRevision: number | null) {
    if (this.writeDelayMs) await new Promise((r) => setTimeout(r, this.writeDelayMs));
    return this.run((s) => {
      const raw = s.getItem(noteKey(subject));
      const current = raw ? (JSON.parse(raw) as NoteRecord).revision : null;
      if (current !== baseRevision) throw new NotesError('conflict');
      const rec: NoteRecord = { subject, text, updatedAt: new Date().toISOString(), revision: (current ?? 0) + 1 };
      s.setItem(noteKey(subject), JSON.stringify(rec));
      return rec;
    });
  }

  shortlist() {
    return this.run((s) => this.readList(s));
  }

  setShortlisted(subject: NoteSubject, on: boolean) {
    return this.run((s) => {
      const list = this.readList(s).filter((x) => !sameSubject(x, subject));
      if (on) list.push(subject);
      s.setItem(LIST_KEY, JSON.stringify(list));
      return list;
    });
  }

  clearAll() {
    return this.run((s) => {
      const keys: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (k?.startsWith(PREFIX)) keys.push(k);
      }
      keys.forEach((k) => s.removeItem(k));
    });
  }

  private readList(s: Storage): NoteSubject[] {
    try {
      const v = JSON.parse(s.getItem(LIST_KEY) ?? '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
}

/** Provided from App.tsx; visual components never import a store directly. Null in demo mode. */
export const NotesContext = createContext<NotesStore | null>(null);
export const useNotesStore = () => useContext(NotesContext);
