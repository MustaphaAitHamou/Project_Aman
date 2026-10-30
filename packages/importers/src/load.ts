import pg from 'pg';

import type { ImportRecord, Rejection, SourceInfo } from './types';

export interface LoadStats {
  runId: string;
  status: string;
  fetched: number;
  inserted: number;
  updated: number;
  unchanged: number;
  merged: number;
  rejected: number;
}

/**
 * Chargement idempotent via les fonctions SQL `etl_*` (une transaction par lot).
 * Aucune suppression : un point absent d'une nouvelle extraction reste en base.
 */
export async function loadRecords(
  client: pg.ClientBase,
  source: SourceInfo,
  records: readonly ImportRecord[],
  transformRejections: readonly Rejection[],
  notes: readonly string[] = [],
  batchSize = 500,
): Promise<LoadStats> {
  await client.query('select public.etl_register_source($1, $2, $3, $4, $5, $6, $7, $8)', [
    source.key,
    source.name,
    source.category,
    source.countryCode,
    source.url,
    source.license,
    source.attribution,
    source.format,
  ]);
  const started = await client.query<{ id: string }>('select public.etl_start_run($1) as id', [
    source.key,
  ]);
  const runId = started.rows[0]!.id;

  try {
    for (let start = 0; start < records.length; start += batchSize) {
      await client.query('begin');
      try {
        for (const record of records.slice(start, start + batchSize)) {
          await client.query('select public.etl_upsert_point($1, $2, $3)', [
            runId,
            record.externalId,
            JSON.stringify(record.payload),
          ]);
        }
        await client.query('commit');
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
    const errors = [
      ...transformRejections
        .slice(0, 500)
        .map((r) => ({ external_id: r.externalId, error: r.reason })),
      ...notes.map((note) => ({ note })),
    ];
    const {
      rows: [run],
    } = await client.query('select * from public.etl_finish_run($1, $2, $3::jsonb)', [
      runId,
      records.length + transformRejections.length,
      JSON.stringify(errors),
    ]);
    return {
      runId,
      status: run.status,
      fetched: run.fetched_count,
      inserted: run.inserted_count,
      updated: run.updated_count,
      unchanged: run.unchanged_count,
      merged: run.merged_count,
      rejected: run.rejected_count + transformRejections.length,
    };
  } catch (error) {
    await client.query('select public.etl_fail_run($1, $2)', [runId, String(error)]);
    throw error;
  }
}

/** Journalise un import qui a échoué avant le chargement (source indisponible…). */
export async function recordFailedRun(
  client: pg.ClientBase,
  source: SourceInfo,
  error: unknown,
): Promise<void> {
  await client.query('select public.etl_register_source($1, $2, $3, $4, $5, $6, $7, $8)', [
    source.key,
    source.name,
    source.category,
    source.countryCode,
    source.url,
    source.license,
    source.attribution,
    source.format,
  ]);
  const started = await client.query<{ id: string }>('select public.etl_start_run($1) as id', [
    source.key,
  ]);
  await client.query('select public.etl_fail_run($1, $2)', [started.rows[0]!.id, String(error)]);
}
