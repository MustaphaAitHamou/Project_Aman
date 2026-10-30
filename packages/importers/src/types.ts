import type {
  AvailabilityStatus,
  OperationalStatus,
  PotabilityEvidenceKind,
  PotabilityStatus,
  SourceCategory,
  WaterPointKind,
  WaterType,
} from '@water-finder/core';

/** Enregistrement normalisé envoyé à la fonction SQL `etl_upsert_point`. */
export interface ImportPayload {
  kind: WaterPointKind;
  latitude: number;
  longitude: number;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  country_code?: string;
  potability?: PotabilityStatus;
  potability_evidence?: {
    kind: PotabilityEvidenceKind;
    source_name: string;
    url?: string | null;
    observed_at?: string | null;
  } | null;
  operational_status?: OperationalStatus;
  availability?: AvailabilityStatus;
  water_type?: WaterType;
  is_free?: boolean | null;
  wheelchair_accessible?: boolean | null;
  opening_hours?: string | null;
  last_verified_at?: string | null;
  url?: string | null;
  license?: string | null;
}

export interface ImportRecord {
  externalId: string;
  payload: ImportPayload;
}

export interface Rejection {
  externalId: string;
  reason: string;
}

export interface TransformResult {
  records: ImportRecord[];
  rejections: Rejection[];
  /** Informations utiles à la vérification humaine (champs absents, métadonnées…). */
  notes: string[];
}

export interface SourceInfo {
  key: string;
  name: string;
  category: SourceCategory;
  countryCode: string;
  url: string;
  license: string;
  attribution: string;
  format: string;
  /**
   * Vrai seulement après vérification humaine (existence, licence, champs, conditions
   * d'utilisation). Une source non vérifiée ne s'importe qu'avec `--allow-unverified`.
   */
  verified: boolean;
  description: string;
}

export interface ConnectorContext {
  http: HttpClient;
  log: (message: string) => void;
  /** Emprise [ouest, sud, est, nord] facultative pour limiter l'import (tests, régions). */
  bbox?: [number, number, number, number];
}

export interface Connector {
  info: SourceInfo;
  run(context: ConnectorContext): Promise<TransformResult>;
}

export interface HttpClient {
  getJson<T = unknown>(url: string, init?: RequestInit): Promise<T>;
  getText(url: string, init?: RequestInit): Promise<string>;
  postForm<T = unknown>(url: string, form: Record<string, string>): Promise<T>;
}
