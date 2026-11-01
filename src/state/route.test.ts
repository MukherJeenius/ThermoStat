import { describe, expect, it } from 'vitest';
import { href, parseRoute } from './route';

describe('routes round-trip', () => {
  it.each(['osm:way/123', 'osm:relation/45', 'demo:7'])('recipient %s', (id) => {
    const r = parseRoute(href.recipient(id));
    expect(r).toEqual({ view: 'explore', sel: { kind: 'recipient', id } });
  });
  it('encodes ids', () => {
    expect(href.recipient('osm:way/123')).toBe('#/explore/r/osm%3Away%2F123');
  });
  it('method with an anchor', () => {
    expect(parseRoute('#/method#costs')).toEqual({ view: 'method', anchor: 'costs' });
  });
  it('evidence record for a commitment', () => {
    expect(parseRoute(href.evidence('hce-recovery-plant', 'study-phase12-route'))).toEqual({
      view: 'explore',
      sel: { kind: 'facility', id: 'hce-recovery-plant' },
      evidence: true,
      commitmentId: 'study-phase12-route',
    });
  });
  it('unknown paths fall back to explore', () => {
    expect(parseRoute('#/nowhere/x')).toEqual({ view: 'explore', sel: null });
    expect(parseRoute('')).toEqual({ view: 'explore', sel: null });
  });
});
