export const USER_ZOOM = 15;
export const MAP_MIN_ZOOM = 2;
export const MAP_MAX_ZOOM = 19;

export const CLUSTER_RADIUS = 50;
/** Au-delà de ce zoom, les points ne sont plus regroupés. */
export const CLUSTER_MAX_ZOOM = 14;

export const SOURCE_ID = 'wf-water-points';
export const USER_SOURCE_ID = 'wf-user-location';

export const LAYER_IDS = {
  clusters: 'wf-clusters',
  clusterCount: 'wf-cluster-count',
  points: 'wf-points',
  selected: 'wf-selected',
  userAccuracy: 'wf-user-accuracy',
  userDot: 'wf-user-dot',
} as const;

/** Hauteur réservée au panneau d'aperçu, pour garder le point sélectionné visible. */
export const PREVIEW_PANEL_PADDING = 320;
