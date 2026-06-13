import { openDB, type IDBPDatabase } from 'idb';
import type { Tournament } from '@/types';

const DB_NAME = 'lbracket';
const DB_VERSION = 1;
const STORE_NAME = 'tournaments';
const MAX_TOURNAMENTS = 3;

let dbInstance: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    },
  });

  return dbInstance;
}

export async function saveTournament(tournament: Tournament): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, tournament);
}

export async function getAllTournaments(): Promise<Tournament[]> {
  const db = await getDb();
  const tournaments = await db.getAll(STORE_NAME);
  return tournaments.sort((a, b) => b.createdAt - a.createdAt).map(migrate);
}

export async function getTournament(id: string): Promise<Tournament | undefined> {
  const db = await getDb();
  const t = await db.get(STORE_NAME, id);
  return t ? migrate(t) : undefined;
}

function migrate(t: Tournament): Tournament {
  return {
    ...t,
    losersToFind: t.losersToFind ?? 1,
    loserIds: t.loserIds ?? [],
  };
}

export async function deleteTournament(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export async function enforceMaxTournaments(): Promise<string | null> {
  const tournaments = await getAllTournaments();
  if (tournaments.length >= MAX_TOURNAMENTS) {
    const oldest = tournaments[tournaments.length - 1];
    await deleteTournament(oldest.id);
    return oldest.name;
  }
  return null;
}

export async function getTournamentCount(): Promise<number> {
  const db = await getDb();
  return db.count(STORE_NAME);
}
