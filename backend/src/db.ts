import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data.json');

export interface EventRecord {
  id: string;
  code: string; // 6桁英数字のイベントコード
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  matchDuration: number;
  breakDuration: number;
  courtCount: number;
  pinHash: string;
  pairVariation: boolean;
  opponentVariation: boolean;
  levelMatching: boolean;
  participants: ParticipantRecord[];
  schedule: any | null;
  createdAt: string;
}

export interface ParticipantRecord {
  id: number;
  name: string;
  level: string;
  ruleUnderstanding: string;
}

interface Database {
  events: Record<string, EventRecord>;
  nextParticipantId: number;
}

function loadDb(): Database {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load database:', e);
  }
  return { events: {}, nextParticipantId: 1 };
}

function saveDb(db: Database): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export const db = {
  getEvent(id: string): EventRecord | undefined {
    const data = loadDb();
    return data.events[id];
  },

  getEventByCode(code: string): EventRecord | undefined {
    const data = loadDb();
    return Object.values(data.events).find(e => e.code === code.toUpperCase());
  },

  createEvent(event: Omit<EventRecord, 'createdAt'>): void {
    const data = loadDb();
    data.events[event.id] = { ...event, createdAt: new Date().toISOString() };
    saveDb(data);
  },

  updateEvent(id: string, updates: Partial<EventRecord>): void {
    const data = loadDb();
    if (data.events[id]) {
      data.events[id] = { ...data.events[id], ...updates };
      saveDb(data);
    }
  },

  addParticipant(id: string, participant: ParticipantRecord): ParticipantRecord | null {
    const data = loadDb();
    if (data.events[id]) {
      data.events[id].participants.push(participant);
      data.events[id].schedule = null; // スケジュールをリセット
      saveDb(data);
      return participant;
    }
    return null;
  },

  getNextParticipantId(): number {
    const data = loadDb();
    const id = data.nextParticipantId;
    data.nextParticipantId++;
    saveDb(data);
    return id;
  }
};
