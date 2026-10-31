import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/services/auth/session';

import {
  listFavorites,
  listNotifications,
  markNotificationsRead,
  myContributions,
  setFavorite,
  signedPhotoUrls,
} from './api';

export const communityKeys = {
  favorites: (userId: string | null) => ['favorites', userId] as const,
  contributions: (userId: string | null) => ['contributions', userId] as const,
  notifications: (userId: string | null) => ['notifications', userId] as const,
};

export function useFavorites() {
  const userId = useUserId();
  return useQuery({
    queryKey: communityKeys.favorites(userId),
    queryFn: listFavorites,
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useIsFavorite(pointId: string | undefined): boolean {
  const favorites = useFavorites();
  return !!pointId && !!favorites.data?.some((f) => f.pointId === pointId);
}

/** Ajoute ou retire un favori, avec mise à jour immédiate de la liste. */
export function useToggleFavorite() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pointId: string; favorite: boolean }) => {
      if (!userId) throw new Error('authentication_required');
      await setFavorite(userId, input.pointId, input.favorite);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: communityKeys.favorites(userId) }),
  });
}

export function useMyContributions() {
  const userId = useUserId();
  return useQuery({
    queryKey: communityKeys.contributions(userId),
    queryFn: myContributions,
    enabled: !!userId,
  });
}

export function useNotifications() {
  const userId = useUserId();
  return useQuery({
    queryKey: communityKeys.notifications(userId),
    queryFn: listNotifications,
    enabled: !!userId,
    refetchInterval: 5 * 60_000,
  });
}

export function useMarkNotificationsRead() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: communityKeys.notifications(userId) }),
  });
}

export function usePhotoUrls(paths: string[]) {
  return useQuery({
    queryKey: ['photo-urls', ...paths],
    queryFn: () => signedPhotoUrls(paths),
    enabled: paths.length > 0,
    // Les URL signées expirent après 1 h : renouvelées avant.
    staleTime: 45 * 60_000,
  });
}
