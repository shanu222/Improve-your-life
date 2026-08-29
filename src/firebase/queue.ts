import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LogEntry } from '../domain/types';
import { logInternalError } from '../domain/errors';
import { isOnline } from '../lib/online';
import { safeCloudSync, syncEntryToCloud } from './sync';

const SYNCED_KEY = 'dailyme.synced.ids.v1';
const PENDING_KEY = 'dailyme.pending.entries.v1';

async function readIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SYNCED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

async function writeIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(SYNCED_KEY, JSON.stringify([...ids].slice(-400)));
}

async function readPending(): Promise<LogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

async function writePending(entries: LogEntry[]): Promise<void> {
  const unique = new Map(entries.map((e) => [e.id, e]));
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify([...unique.values()].slice(-200)));
}

export async function queueEntry(entry: LogEntry): Promise<void> {
  const pending = await readPending();
  pending.push(entry);
  await writePending(pending);
}

export async function flushCloudEntries(uid: string, extra: LogEntry[] = []): Promise<void> {
  if (!uid || !isOnline()) return;
  const synced = await readIds();
  const pending = [...(await readPending()), ...extra];
  const leftover: LogEntry[] = [];
  for (const entry of pending) {
    if (synced.has(entry.id)) continue;
    try {
      const ok = await syncEntryToCloud(uid, entry);
      if (ok) synced.add(entry.id);
      else leftover.push(entry);
    } catch (error) {
      logInternalError('sync.flush', error);
      leftover.push(entry);
    }
  }
  await writeIds(synced);
  await writePending(leftover);
}

export async function enqueueAndSync(uid: string | undefined, entry: LogEntry): Promise<void> {
  await queueEntry(entry);
  if (!uid) return;
  await safeCloudSync(() => flushCloudEntries(uid, [entry]));
}

export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.multiRemove([SYNCED_KEY, PENDING_KEY]);
}
