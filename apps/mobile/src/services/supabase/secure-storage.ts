import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Stockage chiffré de la session (trousseau iOS / Keystore Android).
 * SecureStore limite chaque valeur à ~2 Ko : la session est découpée en morceaux.
 * Sur le web, le stockage local du navigateur est utilisé.
 */
const CHUNK_SIZE = 1800;

function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    const base = safeKey(key);
    const count = Number(await SecureStore.getItemAsync(`${base}.n`));
    if (!Number.isInteger(count) || count <= 0) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(`${base}.${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    const base = safeKey(key);
    await this.removeItem(key);
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i += 1) {
      await SecureStore.setItemAsync(
        `${base}.${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
    await SecureStore.setItemAsync(`${base}.n`, String(count));
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    const base = safeKey(key);
    const count = Number(await SecureStore.getItemAsync(`${base}.n`));
    if (Number.isInteger(count)) {
      for (let i = 0; i < count; i += 1) await SecureStore.deleteItemAsync(`${base}.${i}`);
    }
    await SecureStore.deleteItemAsync(`${base}.n`);
  },
};
