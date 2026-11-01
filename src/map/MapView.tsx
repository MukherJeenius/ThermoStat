/** MapLibre basemap + deck.gl MapboxOverlay (interleaved) for buildings, arcs, endpoints and labels (spec 3.5, 9.3). */
import type { Layer } from '@deck.gl/core';
import { MapboxOverlay } from '@deck.gl/mapbox';
import maplibregl, { type Map as MlMap } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Facility, HeatConnection } from '../contract/data-contract';
import type { AppData } from '../data/load';
import { glyphsUrl, tilesUrl } from '../data/urls';
import { basemapStyle, firstSymbolLayerId } from './basemapStyle';
import { cameraPadding, FACILITY_MAX_ZOOM, fitPoints, FRAME, PITCH, RECIPIENT_MAX_ZOOM, reducedMotion } from './camera';
import { buildingLayers, contextData, DEFAULT_HEIGHT_M, lighting, recipientData } from './layers/buildingLayers';
import { makeHeatLayers, routeLayer } from './layers/heatLayers';
import { endpointLayers, labelLayer, type EndpointDatum, type LabelDatum } from './layers/labels';

let protocolAdded = false;

export type MapSelection =
  | { kind: 'facility'; id: string }
  | { kind: 'recipient'; id: string }
  | { kind: 'connection'; id: string }
  | null;

export interface MapViewProps {
  data: AppData;
  facilities: Facility[];
  connections: HeatConnection[];
  selection: MapSelection;
  focusFacilityId: string | null;
  tab: 'facilities' | 'recipients';
  layers: { facilities: boolean; connections: boolean; buildings: boolean; heat: boolean };
  pitched: boolean;
  resetToken: number;
  zoomDelta: { n: number; d: number };
  onSelectFacility: (id: string) => void;
  onSelectRecipient: (id: string) => void;
  onSelectConnection: (id: string, x: number, y: number) => void;
  onMapReady?: (map: MlMap) => void;
  onBasemapError?: () => void;
  demoCamera?: { points: (readonly number[])[]; maxZoom: number; floor: number } | null;
  demoKey?: number | null;
  arcKinds?: HeatConnection['kind'][] | null;
}

export function MapView(props: MapViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [ready, setReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const tileContext = (props.data.context?.features.length ?? 0) < 2000;
  const style = useMemo(() => basemapStyle(tilesUrl(), glyphsUrl(), tileContext), [tileContext]);
  const beforeId = useMemo(() => firstSymbolLayerId(style), [style]);
  const { data, facilities, connections, selection, tab, layers } = props;

  // one map for the life of the view
  useEffect(() => {
    if (!ref.current) return;
    if (!protocolAdded) {
      maplibregl.addProtocol('pmtiles', new Protocol().tile);
      protocolAdded = true;
    }
    const map = new maplibregl.Map({
      container: ref.current,
      style,
      center: [-79.86, 43.258],
      zoom: 14,
      pitch: PITCH,
      bearing: -17,
      maxBounds: FRAME,
      minZoom: 12,
      maxZoom: 17,
      maxPitch: 60,
      attributionControl: { compact: true, customAttribution: '© OpenStreetMap contributors (ODbL)' },
      fadeDuration: 0,
    });
    map.keyboard.enable();
    map.getCanvas().setAttribute('aria-label', 'Map of Hamilton facilities, connections and candidate buildings');
    map.on('error', (e) => {
      const ev = e as unknown as { error?: Error; sourceId?: string };
      const msg = String(ev.error?.message ?? '');
      if (ev.sourceId === 'protomaps' || /pmtiles|tiles|magic number|404/i.test(msg)) props.onBasemapError?.();
    });
    const overlay = new MapboxOverlay({ interleaved: true, layers: [], effects: [lighting()], pickingRadius: 6 });
    map.addControl(overlay);
    mapRef.current = map;
    overlayRef.current = overlay;
    // test hook (dev builds, or ?testhooks): the screenshot and fidelity scripts read the map from here
    if (import.meta.env.DEV || new URLSearchParams(window.location.search).has('testhooks')) {
      (window as unknown as { __thermostat?: object }).__thermostat = { map, overlay };
    }
    map.once('load', () => {
      setReady(true);
      props.onMapReady?.(map);
    });
    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);

  useEffect(() => {
    let live = true;
    document.fonts?.load('12px "Inter Variable"').then(() => live && setFontsReady(true), () => live && setFontsReady(true));
    return () => {
      live = false;
    };
  }, []);

  const ctxData = useMemo(() => (tileContext ? [] : contextData(data.context)), [data.context, tileContext]);
  const recData = useMemo(() => recipientData(data.recipients.features, false), [data.recipients, tileContext]);
  const routeCoords = useMemo(() => {
    const f = data.network?.features.find((x) => x.properties.role === 'route');
    return f && f.geometry.type === 'LineString' ? f.geometry.coordinates : null;
  }, [data.network]);
  const recById = useMemo(() => new Map(data.recipients.features.map((f) => [f.id, f.properties])), [data.recipients]);
  const facById = useMemo(() => new Map(facilities.map((f) => [f.id, f])), [facilities]);

  // what is drawn follows the selection policy (spec 9.3)
  const drawn = useMemo(() => {
    let conns: HeatConnection[] = [];
    if (tab === 'facilities' && props.focusFacilityId) {
      // facilities show their public-record and study lines; team scenarios appear with the buildings
      conns = connections.filter((c) => c.facilityId === props.focusFacilityId && c.kind !== 'scenario');
    } else if (tab === 'recipients' && selection?.kind === 'recipient') {
      conns = connections.filter((c) => c.recipientId === selection.id);
    } else if (selection?.kind === 'connection') {
      conns = connections.filter((c) => c.id === selection.id);
    }
    if (props.arcKinds) conns = conns.filter((c) => props.arcKinds!.includes(c.kind));
    return conns;
  }, [tab, props.focusFacilityId, selection, connections, props.arcKinds]);

  const targetZ = (c: HeatConnection) => {
    if (c.recipientId) return (recById.get(c.recipientId)?.heightM ?? DEFAULT_HEIGHT_M) + 2;
    return 0;
  };

  const endpoints = useMemo<EndpointDatum[]>(() => {
    const out: EndpointDatum[] = [];
    if (layers.facilities) {
      for (const f of facilities)
        out.push({
          id: `fac-${f.id}`,
          position: [f.position[0], f.position[1], 0],
          role: 'source',
          facilityId: f.id,
          selected: f.id === props.focusFacilityId,
        });
    }
    for (const c of drawn) {
      out.push({
        id: `end-${c.id}`,
        position: [c.target[0], c.target[1], targetZ(c)],
        role: c.kind,
        recipientId: c.recipientId,
        connectionId: c.id,
        facilityId: facById.has(c.recipientName) ? c.recipientName : undefined,
      });
    }
    if (tab === 'recipients') {
      for (const f of data.recipients.features) {
        const r = f.properties;
        if (r.rank && !drawn.some((c) => c.recipientId === r.id)) {
          out.push({ id: `rank-${r.id}`, position: [r.position[0], r.position[1], (r.heightM ?? DEFAULT_HEIGHT_M) + 2], role: 'scenario', recipientId: r.id });
        }
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.facilities, facilities, drawn, tab, data.recipients, recById, facById, props.focusFacilityId]);

  const labels = useMemo<LabelDatum[]>(() => {
    const out: LabelDatum[] = [];
    // only the selected place is labelled; the rail names the rest, so nothing overlaps
    if (layers.facilities && selection?.kind !== 'recipient') {
      const f = facilities.find((x) => x.id === props.focusFacilityId);
      if (f) out.push({ id: f.id, text: f.mapLabel, position: [f.position[0], f.position[1], 0], priority: 3 });
    }
    if (selection?.kind === 'recipient') {
      const r = recById.get(selection.id);
      if (r) out.push({ id: r.id, text: r.name ?? 'Unnamed building', position: [r.position[0], r.position[1], (r.heightM ?? DEFAULT_HEIGHT_M) + 2], priority: 3 });
    }
    return out;
  }, [layers.facilities, facilities, selection, recById, props.focusFacilityId]);

  // push layers to the overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !ready) return;
    const selRecipient = selection?.kind === 'recipient' ? selection.id : null;
    const deckLayers: Layer[] = [
      ...buildingLayers({
        context: ctxData,
        recipients: recData,
        visible: layers.buildings,
        heatOn: layers.heat,
        rampBreaks: data.meta?.rampBreaksMwh ?? null,
        selectedId: selRecipient,
        onSelectRecipient: props.onSelectRecipient,
        beforeId,
      }),
      ...routeLayer(routeCoords, layers.connections, beforeId),
      ...makeHeatLayers(drawn, {
        visible: layers.connections,
        onSelect: (id) => {
          const c = connections.find((x) => x.id === id);
          const m = mapRef.current;
          if (c && m) {
            const p = m.project([c.target[0], c.target[1]]);
            props.onSelectConnection(id, p.x, p.y);
          }
        },
        selectedConnectionId: selection?.kind === 'connection' ? selection.id : null,
        targetZ,
        beforeId,
      }),
      ...endpointLayers({
        data: layers.connections ? endpoints : endpoints.filter((e) => e.role === 'source' && !e.connectionId),
        visible: true,
        beforeId,
        onPick: (d) => {
          if (d.connectionId) {
            const m = mapRef.current;
            const p = m?.project([d.position[0], d.position[1]]);
            props.onSelectConnection(d.connectionId, p?.x ?? 0, p?.y ?? 0);
          } else if (d.recipientId) props.onSelectRecipient(d.recipientId);
          else if (d.facilityId) props.onSelectFacility(d.facilityId);
        },
      }),
    ];
    if (fontsReady) deckLayers.push(labelLayer({ data: labels, visible: true, beforeId }));
    overlay.setProps({ layers: deckLayers });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fontsReady, ctxData, recData, layers, drawn, endpoints, labels, selection, data.meta, beforeId, routeCoords]);

  // camera: one move per selection change (spec 9.3)
  const firstCamera = useRef(true);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !ref.current) return;
    if (props.demoKey) return; // the demo step owns the camera
    const padding = cameraPadding(ref.current);
    const animate = !firstCamera.current;
    firstCamera.current = false;
    if (selection?.kind === 'recipient') {
      const r = recById.get(selection.id);
      if (!r) return;
      const arc = connections.find((c) => c.recipientId === r.id);
      const pts = arc ? [r.position, arc.source] : [r.position];
      fitPoints(map, pts, r.position, RECIPIENT_MAX_ZOOM, padding, animate);
      return;
    }
    if (selection?.kind === 'facility' || (!selection && props.focusFacilityId)) {
      const fid = selection?.kind === 'facility' ? selection.id : props.focusFacilityId!;
      const f = facById.get(fid);
      if (!f) return;
      const own = connections.filter((c) => c.facilityId === fid);
      if (fid === data.meta?.defaultFacilityId) {
        // opening view: the plant's proposed targets and the ranked recipients, not the plant itself
        const pts = [
          ...own.filter((c) => c.kind === 'proposed').map((c) => c.target),
          ...data.recipients.features.filter((x) => x.properties.rank && x.properties.rank <= 5).map((x) => x.properties.position),
        ];
        if (pts.length >= 2) {
          const mid = [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length];
          fitPoints(map, pts, mid, 15.2, padding, animate, 13.6);
          return;
        }
      }
      const pts = [f.position, ...own.map((c) => c.target)];
      fitPoints(map, pts, f.position, FACILITY_MAX_ZOOM, padding, animate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selection?.kind, selection?.id, props.resetToken]);

  // demo mode: one camera move per step, after the panels for that step have laid out
  useEffect(() => {
    const map = mapRef.current;
    const cam = props.demoCamera;
    if (!map || !ready || !ref.current || !props.demoKey || !cam || cam.points.length === 0) return;
    const el = ref.current;
    const t = window.setTimeout(() => {
      const focus = cam.points[0];
      fitPoints(map, cam.points, focus, cam.maxZoom, cameraPadding(el), true, cam.floor);
    }, 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, props.demoKey]);

  // 2D / 3D and zoom controls
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.easeTo({ pitch: props.pitched ? PITCH : 0, duration: reducedMotion() ? 0 : 600 });
  }, [props.pitched, ready]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || props.zoomDelta.n === 0) return;
    map.easeTo({ zoom: map.getZoom() + props.zoomDelta.d, duration: reducedMotion() ? 0 : 300 });
  }, [props.zoomDelta, ready]);

  return <div ref={ref} className={`ts-map${ready ? ' is-ready' : ''}`} />;
}
