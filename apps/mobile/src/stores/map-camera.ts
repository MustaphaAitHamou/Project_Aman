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
  requestCamera: (target: CameraTarget) => void;
  clearPendingTarget: () => void;
}

/** Demandes de déplacement de la carte venant d'autres écrans (ex. recherche d'une ville). */
export const useMapCameraStore = create<MapCameraState>()((set) => ({
  pendingTarget: null,
  requestCamera: (pendingTarget) => set({ pendingTarget }),
  clearPendingTarget: () => set({ pendingTarget: null }),
}));
