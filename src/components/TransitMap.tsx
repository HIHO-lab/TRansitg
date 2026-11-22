import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import type { DatasetSourceType, JourneyOption, TransitStop } from '../data/types';

interface TransitMapProps {
  stops: TransitStop[];
  selectedOption: JourneyOption | null;
  sourceType: DatasetSourceType;
}

const DELHI_CENTER: [number, number] = [28.6139, 77.2295];

export function TransitMap({ stops, selectedOption, sourceType }: TransitMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DELHI_CENTER,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false,
      zoomAnimation: false,
      fadeAnimation: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.stop();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Re-render markers and route schematic/GPS polylines when stops or selectedOption change
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const stopById = new Map(stops.map((s) => [s.id, s]));

    const activeStopIds = new Set<string>();
    const boundsPoints: L.LatLngExpression[] = [];

    if (selectedOption) {
      selectedOption.corridor.legs.forEach((leg) => {
        leg.stopIds.forEach((id) => activeStopIds.add(id));

        const pathPoints: L.LatLngExpression[] =
          leg.geometryType === 'gps_trace' && leg.coordinates && leg.coordinates.length > 1
            ? leg.coordinates
            : leg.stopIds
                .map((id) => stopById.get(id))
                .filter((s): s is TransitStop => Boolean(s))
                .map((s) => [s.lat, s.lng] as [number, number]);

        if (pathPoints.length >= 2) {
          L.polyline(pathPoints, {
            color: leg.lineColor,
            weight: 4,
            opacity: 0.9,
            dashArray: leg.geometryType === 'gps_trace' ? undefined : '8, 7',
          })
            .bindPopup(
              `<strong>${leg.lineName}</strong><br/>${
                leg.geometryType === 'gps_trace'
                  ? 'Verified GPS route trace'
                  : 'Schematic straight-line connector (not a GPS trace)'
              }`
            )
            .addTo(layerGroup);

          pathPoints.forEach((pt) => boundsPoints.push(pt));
        }
      });
    }

    stops.forEach((stop) => {
      const isHighlighted = activeStopIds.has(stop.id);
      const isOrigin = selectedOption?.corridor.originStopId === stop.id;
      const isDest = selectedOption?.corridor.destinationStopId === stop.id;

      const fillColor = isOrigin
        ? '#0F766E'
        : isDest
          ? '#DC2626'
          : isHighlighted
            ? '#1E293B'
            : '#64748B';

      const marker = L.circleMarker([stop.lat, stop.lng], {
        radius: isOrigin || isDest ? 8 : isHighlighted ? 6.5 : 5,
        color: '#FFFFFF',
        weight: 2,
        fillColor,
        fillOpacity: isHighlighted || !selectedOption ? 0.95 : 0.45,
      });

      const roleTag = isOrigin
        ? 'Origin'
        : isDest
          ? 'Destination'
          : isHighlighted
            ? 'Intermediate Hub'
            : 'Dataset Hub';

      marker.bindPopup(
        `<div>
          <div style="font-weight:600;color:#0f172a;">${stop.name} (${stop.code})</div>
          <div style="color:#475569;margin-top:2px;">${roleTag} · ${stop.area}</div>
          <div style="color:#64748b;margin-top:4px;font-size:11px;">
            ${
              stop.coordinateSource === 'verified_gtfs'
                ? 'Verified GTFS stop coordinate'
                : 'Approximate hub reference point (synthetic test fixture)'
            }
          </div>
        </div>`
      );

      marker.addTo(layerGroup);

      if (!selectedOption) {
        boundsPoints.push([stop.lat, stop.lng]);
      }
    });

    if (boundsPoints.length >= 2) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [36, 36],
        maxZoom: 13,
        animate: false,
      });
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 13, { animate: false });
    } else {
      map.setView(DELHI_CENTER, 12, { animate: false });
    }
  }, [stops, selectedOption]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const pts: L.LatLngExpression[] = stops.map((s) => [s.lat, s.lng]);
    if (pts.length >= 2) {
      map.fitBounds(L.latLngBounds(pts), {
        padding: [36, 36],
        maxZoom: 13,
        animate: false,
      });
    } else {
      map.setView(DELHI_CENTER, 12, { animate: false });
    }
  };

  const usesGpsGeometry = selectedOption?.corridor.legs.every(
    (leg) => leg.geometryType === 'gps_trace'
  );

  return (
    <section
      aria-labelledby="transit-map-heading"
      className="rounded-xl bg-white border border-slate-200 overflow-hidden flex flex-col"
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2
            id="transit-map-heading"
            className="text-base font-display font-semibold text-slate-900"
          >
            Delhi Corridor Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedOption
              ? `Showing ${selectedOption.corridor.name}`
              : `Showing ${stops.length} reference transit hubs in active dataset`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRecenter}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reset view</span>
        </button>
      </div>

      <div
        ref={containerRef}
        data-testid="delhi-leaflet-map"
        className="w-full h-[360px] sm:h-[420px] lg:h-[460px] relative"
        role="region"
        aria-label="Interactive OpenStreetMap view of Delhi transit hubs and corridor connectors"
      />

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-700" aria-hidden="true" />
            Origin
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />
            Destination
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-800" aria-hidden="true" />
            Intermediate Hub
          </span>
        </div>

        <p className="text-slate-500">
          {usesGpsGeometry
            ? 'Solid paths render verified GPS traces from loaded dataset.'
            : sourceType === 'synthetic_sample'
              ? 'Dashed lines are straight-line schematic connectors between sample hubs, not real GPS traces.'
              : 'Dashed lines indicate schematic connectors pending GPS trace geometry.'}
        </p>
      </div>
    </section>
  );
}
