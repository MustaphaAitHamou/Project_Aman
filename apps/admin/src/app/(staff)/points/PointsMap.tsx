'use client';

import 'maplibre-gl/dist/maplibre-gl.css';

import * as maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';

export interface MapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
}

const COLORS: Record<string, string> = {
  published: '#0075C4',
  pending: '#C77700',
  rejected: '#B42318',
  merged: '#667085',
};

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

/** Carte des résultats de recherche (couleur = statut de publication). */
export function PointsMap({ points }: { points: MapPoint[] }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: STYLE_URL,
      center: [2.45, 46.6],
      zoom: 4.8,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    const bounds = new maplibregl.LngLatBounds();
    for (const point of points) {
      const element = document.createElement('div');
      element.style.cssText = `width:14px;height:14px;border-radius:50%;border:2px solid #fff;background:${COLORS[point.status] ?? '#667085'}`;
      new maplibregl.Marker({ element })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setText(point.name))
        .addTo(map);
      bounds.extend([point.longitude, point.latitude]);
    }
    if (points.length > 0) map.fitBounds(bounds, { padding: 40, maxZoom: 16, duration: 0 });
    return () => map.remove();
  }, [points]);

  return <div ref={container} className="map" role="region" aria-label="Carte des points" />;
}
