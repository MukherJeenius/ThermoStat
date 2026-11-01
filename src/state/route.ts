/** Hash routes (spec 9.12). Every id segment is encodeURIComponent'd; #/method#costs is the view plus an anchor. */

export type Route =
  | { view: 'explore'; sel: null }
  | { view: 'explore'; sel: { kind: 'facility'; id: string }; evidence: boolean; commitmentId: string | null }
  | { view: 'explore'; sel: { kind: 'recipient'; id: string } }
  | { view: 'explore'; sel: { kind: 'connection'; id: string } }
  | { view: 'records'; anchor: string | null }
  | { view: 'method'; anchor: string | null }
  | { view: 'brief'; id: string }
  | { view: 'place'; kind: 'facility' | 'recipient'; id: string; anchor: string | null };

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#/, '');
  const [path, anchor = null] = h.split('#');
  const parts = path.split('/').filter(Boolean).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  if (parts[0] === 'records') return { view: 'records', anchor };
  if (parts[0] === 'method') return { view: 'method', anchor };
  if (parts[0] === 'brief' && parts[1]) return { view: 'brief', id: parts[1] };
  if (parts[0] === 'place' && (parts[1] === 'f' || parts[1] === 'r') && parts[2]) {
    return { view: 'place', kind: parts[1] === 'f' ? 'facility' : 'recipient', id: parts[2], anchor };
  }
  if (parts[0] === 'explore' && parts[1] && parts[2]) {
    if (parts[1] === 'f') {
      return {
        view: 'explore',
        sel: { kind: 'facility', id: parts[2] },
        evidence: parts[3] === 'evidence',
        commitmentId: parts[3] === 'evidence' && parts[4] ? parts[4] : null,
      };
    }
    if (parts[1] === 'r') return { view: 'explore', sel: { kind: 'recipient', id: parts[2] } };
    if (parts[1] === 'c') return { view: 'explore', sel: { kind: 'connection', id: parts[2] } };
  }
  return { view: 'explore', sel: null };
}

const enc = encodeURIComponent;

export const href = {
  explore: () => '#/explore',
  facility: (id: string) => `#/explore/f/${enc(id)}`,
  evidence: (id: string, commitmentId?: string) =>
    `#/explore/f/${enc(id)}/evidence${commitmentId ? `/${enc(commitmentId)}` : ''}`,
  recipient: (id: string) => `#/explore/r/${enc(id)}`,
  connection: (id: string) => `#/explore/c/${enc(id)}`,
  records: () => '#/records',
  method: (anchor?: string) => `#/method${anchor ? `#${anchor}` : ''}`,
  brief: (id: string) => `#/brief/${enc(id)}`,
  placeFacility: (id: string, anchor?: string) => `#/place/f/${enc(id)}${anchor ? `#${anchor}` : ''}`,
  placeRecipient: (id: string) => `#/place/r/${enc(id)}`,
};
