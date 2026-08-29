import * as SQLite from 'expo-sqlite';
import { MemoryStore } from './memoryStore';
import { emptySnapshot, type Snapshot } from './types';

export async function tryOpenSqliteStore(): Promise<MemoryStore | null> {
  try {
    const db = await SQLite.openDatabaseAsync('daily.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS snapshot_blob (
        id TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL
      );
    `);
    const row = await db.getFirstAsync<{ payload: string }>(
      'SELECT payload FROM snapshot_blob WHERE id = ?',
      ['v1'],
    );
    const data: Snapshot = row?.payload ? { ...emptySnapshot(), ...JSON.parse(row.payload) } : emptySnapshot();
    return new MemoryStore(data, async (next) => {
      await db.runAsync('INSERT OR REPLACE INTO snapshot_blob (id, payload) VALUES (?, ?)', [
        'v1',
        JSON.stringify(next),
      ]);
    });
  } catch {
    return null;
  }
}
