import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoryStore } from './memoryStore';
import type { Snapshot } from './types';
import { emptySnapshot } from './types';

const KEY = 'daily.snapshot.v1';

export async function loadPersistedStore(): Promise<MemoryStore> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const data: Snapshot = raw ? { ...emptySnapshot(), ...JSON.parse(raw) } : emptySnapshot();
    return new MemoryStore(data, async (next) => {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    });
  } catch {
    return new MemoryStore(emptySnapshot(), async (next) => {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    });
  }
}

export async function clearPersistedStore(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
