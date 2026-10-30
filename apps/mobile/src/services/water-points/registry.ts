import type { WaterPointRepository } from '@water-finder/core';

import { env } from '@/config/env';
import { getSupabase } from '@/services/supabase/client';

import { createSupabaseRepository } from './supabase-repository';

let repository: WaterPointRepository | null | undefined;

function createRepository(): WaterPointRepository | null {
  // Comparaison directe sur `process.env` : la variable est remplacée à la compilation et la branche
  // est éliminée hors mode démo, de sorte que les données fictives ne sont pas embarquées.
  if (process.env.EXPO_PUBLIC_DEMO_DATA === 'true' && env.demoData) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const demo = require('./demo/demo-repository') as typeof import('./demo/demo-repository');
    return demo.createDemoRepository();
  }
  const supabase = getSupabase();
  return supabase ? createSupabaseRepository(supabase) : null;
}

/**
 * Source des points d'eau : backend Supabase / PostGIS s'il est configuré, sinon aucune
 * (l'application l'indique). Le mode démonstration n'existe qu'en développement.
 */
export function getWaterPointRepository(): WaterPointRepository | null {
  if (repository === undefined) repository = createRepository();
  return repository;
}

/** Réservé aux tests. */
export function setWaterPointRepositoryForTesting(
  value: WaterPointRepository | null | undefined,
): void {
  repository = value;
}
