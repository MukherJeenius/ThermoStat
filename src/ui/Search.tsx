/** "Find a place" (spec 9.11): an ARIA 1.2 combobox over facilities, recipients and neighbourhoods. Offline only. */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Facility, Place, Recipient } from '../contract/data-contract';
import { Search as SearchIcon } from './icons';

type Option = { key: string; group: 'Facilities' | 'Recipients' | 'Neighbourhoods'; label: string; sub: string; pick: () => void };

export function Search({ facilities, recipients, places, onFacility, onRecipient, onPlace }: {
  facilities: Facility[];
  recipients: Recipient[];
  places: Place[];
  onFacility: (id: string) => void;
  onRecipient: (id: string) => void;
  onPlace?: (p: Place) => void;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const options = useMemo<Option[]>(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const m = (x: string | null) => !!x && x.toLowerCase().includes(s);
    const out: Option[] = [];
    for (const f of facilities) if (m(f.name) || m(f.address) || m(f.mapLabel)) out.push({ key: `f-${f.id}`, group: 'Facilities', label: f.name, sub: f.address ?? f.locality, pick: () => onFacility(f.id) });
    for (const r of recipients) if (m(r.name) || m(r.address)) out.push({ key: `r-${r.id}`, group: 'Recipients', label: r.name ?? 'Unnamed building', sub: r.address ?? (r.rank ? `Recipient ${r.rank}` : 'Candidate'), pick: () => onRecipient(r.id) });
    for (const p of places) if (m(p.name)) out.push({ key: `p-${p.name}`, group: 'Neighbourhoods', label: p.name, sub: 'Neighbourhood', pick: () => onPlace?.(p) });
    return out.slice(0, 12);
  }, [q, facilities, recipients, places, onFacility, onRecipient, onPlace]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const choose = (o: Option) => {
    o.pick();
    setQ('');
    setOpen(false);
  };
  let lastGroup = '';
  return (
    <div className="ts-search">
      <SearchIcon />
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open && q.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${id}-${active}` : undefined}
        aria-label="Find a place"
        placeholder="Find a place"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          else if (e.key === 'Enter' && options[active]) { e.preventDefault(); choose(options[active]); }
          else if (e.key === 'Escape') { setOpen(false); }
        }}
      />
      {open && q.trim() && (
        <div className="ts-pop" role="listbox" id={`${id}-list`} aria-label="Places">
          {options.length === 0 ? (
            <p className="ts-meta ts-noresult">
              Nothing in these records matches “{q}”. Try {facilities.slice(0, 3).map((f) => f.mapLabel).join(', ')}.
            </p>
          ) : (
            options.map((o, i) => {
              const head = o.group !== lastGroup ? <p className="ts-option-group" role="presentation">{o.group}</p> : null;
              lastGroup = o.group;
              return (
                <div key={o.key} role="presentation">
                  {head}
                  <div role="option" id={`${id}-${i}`} aria-selected={i === active} tabIndex={-1}
                    onMouseDown={(e) => { e.preventDefault(); choose(o); }}>
                    {o.label}
                    <small>{o.sub}</small>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
