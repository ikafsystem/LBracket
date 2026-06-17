import type { Tournament } from '@/types';

const MAX_TOURNAMENTS = 3;

function isProduction(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('pages.dev') ||
    window.location.hostname.includes('lbracket');
}

function getApiBase(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

function migrate(t: Tournament): Tournament {
  return {
    ...t,
    losersToFind: t.losersToFind ?? 1,
    loserIds: t.loserIds ?? [],
    tournamentType: (t as any).tournamentType ?? 'losers-bracket',
    prize: (t as any).prize ?? undefined,
  };
}

async function apiGetAll(): Promise<Tournament[]> {
  const res = await fetch(`${getApiBase()}/api/tournaments`);
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(migrate);
}

async function apiGet(id: string): Promise<Tournament | undefined> {
  const res = await fetch(`${getApiBase()}/api/tournaments/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return migrate(data);
}

async function apiSave(tournament: Tournament): Promise<void> {
  await fetch(`${getApiBase()}/api/tournaments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tournament),
  });
}

async function apiDelete(id: string): Promise<void> {
  await fetch(`${getApiBase()}/api/tournaments/${id}`, { method: 'DELETE' });
}

async function apiCount(): Promise<number> {
  const all = await apiGetAll();
  return all.length;
}

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'lbracket';
const DB_VERSION = 1;
const STORE_NAME = 'tournaments';

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

async function localGetAll(): Promise<Tournament[]> {
  const db = await getDb();
  const tournaments = await db.getAll(STORE_NAME);
  return tournaments.sort((a, b) => b.createdAt - a.createdAt).map(migrate);
}

async function localGet(id: string): Promise<Tournament | undefined> {
  const db = await getDb();
  const t = await db.get(STORE_NAME, id);
  return t ? migrate(t) : undefined;
}

async function localSave(tournament: Tournament): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, tournament);
}

async function localDelete(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

async function localCount(): Promise<number> {
  const db = await getDb();
  return db.count(STORE_NAME);
}

export async function saveTournament(tournament: Tournament): Promise<void> {
  if (isProduction()) {
    await apiSave(tournament);
  } else {
    await localSave(tournament);
  }
}

export async function getAllTournaments(): Promise<Tournament[]> {
  if (isProduction()) {
    return apiGetAll();
  } else {
    return localGetAll();
  }
}

export async function getTournament(id: string): Promise<Tournament | undefined> {
  if (isProduction()) {
    return apiGet(id);
  } else {
    return localGet(id);
  }
}

export async function deleteTournament(id: string): Promise<void> {
  if (isProduction()) {
    await apiDelete(id);
  } else {
    await localDelete(id);
  }
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
  if (isProduction()) {
    return apiCount();
  } else {
    return localCount();
  }
}
