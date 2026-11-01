/** deck.gl adapter example. Requires @deck.gl/layers; attach layers through your
 * existing MapLibre/deck integration. No basemap, API or route is created here. */
import { ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { HeatConnection } from './data-contract';
export function makeHeatLayers(connections: HeatConnection[], options: {
  visible: boolean;
  onSelect: (connectionId: string) => void;
}) {
  // Default to one selected facility. Parent filters facilityId before calling.
  // Geometry shows endpoints, not an engineered pipe route.
  return [
    new ArcLayer<HeatConnection>({
      id: 'ts-heat-connections', data: connections, visible: options.visible,
      getSourcePosition: d => [...d.source], getTargetPosition: d => [...d.target],
      getSourceColor: [230,131,56,210], getTargetColor: [164,154,169,190],
      getWidth: 2, widthUnits: 'pixels', getHeight: .5,
      pickable: true, autoHighlight: true,
      onClick: info => { if(info.object) options.onSelect(info.object.id); },
    }),
    new ScatterplotLayer<HeatConnection>({
      id: 'ts-heat-endpoints', data: connections, visible: options.visible,
      getPosition: d => [...d.target], getFillColor: [164,154,169,230],
      getRadius: 3, radiusUnits: 'pixels', radiusMinPixels: 3,
      stroked: true, getLineColor: [253,252,249], lineWidthMinPixels: 1,
      pickable: true,
      onClick: info => { if(info.object) options.onSelect(info.object.id); },
    })
  ];
}
