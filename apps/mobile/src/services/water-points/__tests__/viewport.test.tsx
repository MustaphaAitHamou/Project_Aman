import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import {
  bboxContains,
  DEFAULT_FILTERS,
  isPotabilityStatus,
  normalizePotability,
  type BBox,
} from '@water-finder/core';
import type { ReactNode } from 'react';

import { createDemoRepository } from '../demo/demo-repository';
import { createDemoWaterPoints } from '../demo/demo-fixtures';
import { setWaterPointRepositoryForTesting } from '../registry';
import { MIN_DATA_ZOOM, toQueryBBox, useWaterPointsInViewport } from '../useWaterPointsInViewport';

const PARIS_VIEWPORT: BBox = [2.34, 48.85, 2.365, 48.862];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => setWaterPointRepositoryForTesting(undefined));

describe('emprise demandée au serveur', () => {
  it('englobe la zone visible avec une marge', () => {
    const query = toQueryBBox({ bounds: PARIS_VIEWPORT, zoom: 15 });
    expect(bboxContains(query, PARIS_VIEWPORT)).toBe(true);
  });
});

describe('useWaterPointsInViewport', () => {
  it('indique l’absence de source de données (phase 1 sans démo)', async () => {
    setWaterPointRepositoryForTesting(null);
    const { result } = await renderHook(
      () => useWaterPointsInViewport({ bounds: PARIS_VIEWPORT, zoom: 15 }, DEFAULT_FILTERS),
      { wrapper },
    );
    expect(result.current.status).toBe('no_source');
  });

  it('ne charge rien sous le zoom minimal', async () => {
    const repository = createDemoRepository({ latencyMs: 0 });
    const spy = jest.spyOn(repository, 'findInBounds');
    setWaterPointRepositoryForTesting(repository);
    const { result } = await renderHook(
      () =>
        useWaterPointsInViewport(
          { bounds: [-5, 41, 10, 51], zoom: MIN_DATA_ZOOM - 0.5 },
          DEFAULT_FILTERS,
        ),
      { wrapper },
    );
    expect(result.current.status).toBe('zoom_in');
    expect(spy).not.toHaveBeenCalled();
  });

  it('charge les points de la zone avec les filtres', async () => {
    setWaterPointRepositoryForTesting(createDemoRepository({ latencyMs: 0 }));
    const { result } = await renderHook(
      () =>
        useWaterPointsInViewport(
          { bounds: PARIS_VIEWPORT, zoom: 15 },
          { ...DEFAULT_FILTERS, potability: 'certified' },
        ),
      { wrapper },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    if (result.current.status !== 'ready') throw new Error('état inattendu');
    expect(result.current.points.length).toBeGreaterThan(0);
    expect(result.current.points.every((p) => p.potability === 'certified_potable')).toBe(true);
  });

  it('réutilise le cache pour un petit déplacement', async () => {
    const repository = createDemoRepository({ latencyMs: 0 });
    const spy = jest.spyOn(repository, 'findInBounds');
    setWaterPointRepositoryForTesting(repository);
    const { result, rerender } = await renderHook(
      ({ bounds }: { bounds: BBox }) =>
        useWaterPointsInViewport({ bounds, zoom: 15.2 }, DEFAULT_FILTERS),
      { wrapper, initialProps: { bounds: PARIS_VIEWPORT } },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await rerender({ bounds: [2.3401, 48.8501, 2.3651, 48.8621] });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('données de démonstration', () => {
  const points = createDemoWaterPoints(new Date('2026-10-29T12:00:00Z'));

  it('sont explicitement nommées et sourcées comme fictives', () => {
    for (const point of points) {
      expect(point.name).toMatch(/démonstration/);
      expect(point.sources.every((source) => source.sourceName.includes('fictives'))).toBe(true);
    }
  });

  it('respectent la règle de certification de la potabilité', () => {
    for (const point of points) {
      expect(isPotabilityStatus(point.potability)).toBe(true);
      expect(normalizePotability(point.potability, point.potabilityEvidence)).toBe(
        point.potability,
      );
      if (point.potability === 'certified_potable')
        expect(point.primarySourceCategory).toBe('official');
    }
  });

  it('couvrent tous les statuts utiles aux tests d’interface', () => {
    const potability = new Set(points.map((p) => p.potability));
    const operational = new Set(points.map((p) => p.operationalStatus));
    expect(potability.size).toBe(4);
    expect(operational).toEqual(new Set(['working', 'out_of_order', 'unknown']));
  });
});
