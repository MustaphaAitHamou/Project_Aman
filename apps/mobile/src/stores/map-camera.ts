import type { LngLat } from '@water-finder/core';
import { create } from 'zustand';

export interface CameraTarget {
  center: LngLat;
  zoom: number;
  /** Centrer sur la position de l'utilisateur plutôt que sur `center`. */
  followUser?: boolean;
}

interface MapCameraState {
  pendingTarget: CameraTarget | null;
  /** Centre et zoom actuels de la carte (en mémoire), ex. pour placer un nouveau point. */
  lastView: { center: LngLat; zoom: number } | null;
  setLastView: (view: { center: LngLat; zoom: number }) => void;
  requestCamera: (target: CameraTarget) => void;
  clearPendingTarget: () => void;
}

/** Demandes de déplacement de la carte venant d'autres écrans (ex. recherche d'une ville). */
export const useMapCameraStore = create<MapCameraState>()((set) => ({
  pendingTarget: null,
  lastView: null,
  setLastView: (lastView) => set({ lastView }),
  requestCamera: (pendingTarget) => set({ pendingTarget }),
  clearPendingTarget: () => set({ pendingTarget: null }),
}));
