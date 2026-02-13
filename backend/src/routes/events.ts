import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db, ParticipantRecord } from '../db.js';
import { generateSchedule, Participant } from '../matchmaker.js';

const router = Router();

function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// Create new event
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      name, date, startTime, endTime, matchDuration, breakDuration,
      courtCount, pin, participants, pairVariation, opponentVariation, levelMatching
    } = req.body;

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'PINは4桁の数字で入力してください' });
      return;
    }

    const eventId = nanoid(10);
    const pinHash = hashPin(pin);

    const participantRecords: ParticipantRecord[] = participants.map((p: any) => ({
      id: db.getNextParticipantId(),
      name: p.name,
      level: p.level,
      ruleUnderstanding: p.ruleUnderstanding
    }));

    db.createEvent({
      id: eventId,
      name,
      date,
      startTime,
      endTime,
      matchDuration,
      breakDuration,
      courtCount,
      pinHash,
      pairVariation: !!pairVariation,
      opponentVariation: !!opponentVariation,
      levelMatching: !!levelMatching,
      participants: participantRecords,
      schedule: null
    });

    res.json({ eventId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'イベントの作成に失敗しました' });
  }
});

// Get event details
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const event = db.getEvent(id);
    if (!event) {
      res.status(404).json({ error: 'イベントが見つかりません' });
      return;
    }

    res.json({
      id: event.id,
      name: event.name,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      matchDuration: event.matchDuration,
      breakDuration: event.breakDuration,
      courtCount: event.courtCount,
      pairVariation: event.pairVariation,
      opponentVariation: event.opponentVariation,
      levelMatching: event.levelMatching,
      participants: event.participants.map(p => ({
        id: p.id,
        name: p.name,
        level: p.level,
        ruleUnderstanding: p.ruleUnderstanding
      })),
      schedule: event.schedule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'イベントの取得に失敗しました' });
  }
});

// Verify PIN
router.post('/:id/verify-pin', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { pin } = req.body;
    const event = db.getEvent(id);

    if (!event) {
      res.status(404).json({ error: 'イベントが見つかりません' });
      return;
    }

    const valid = event.pinHash === hashPin(pin);
    res.json({ valid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'PIN検証に失敗しました' });
  }
});

// Update event
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { pin, name, date, startTime, endTime, matchDuration, breakDuration, courtCount, participants, pairVariation, opponentVariation, levelMatching } = req.body;

    const event = db.getEvent(id);
    if (!event) {
      res.status(404).json({ error: 'イベントが見つかりません' });
      return;
    }

    if (event.pinHash !== hashPin(pin)) {
      res.status(403).json({ error: 'PINが正しくありません' });
      return;
    }

    const participantRecords: ParticipantRecord[] = participants.map((p: any) => ({
      id: p.id || db.getNextParticipantId(),
      name: p.name,
      level: p.level,
      ruleUnderstanding: p.ruleUnderstanding
    }));

    db.updateEvent(id, {
      name,
      date,
      startTime,
      endTime,
      matchDuration,
      breakDuration,
      courtCount,
      pairVariation: !!pairVariation,
      opponentVariation: !!opponentVariation,
      levelMatching: !!levelMatching,
      participants: participantRecords,
      schedule: null
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'イベントの更新に失敗しました' });
  }
});

// Generate schedule
router.post('/:id/generate', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { pin } = req.body;

    const event = db.getEvent(id);
    if (!event) {
      res.status(404).json({ error: 'イベントが見つかりません' });
      return;
    }

    if (event.pinHash !== hashPin(pin)) {
      res.status(403).json({ error: 'PINが正しくありません' });
      return;
    }

    const participantList: Participant[] = event.participants.map(p => ({
      id: p.id,
      name: p.name,
      level: p.level as 'beginner' | 'intermediate' | 'advanced',
      ruleUnderstanding: p.ruleUnderstanding as 'knows' | 'newbie'
    }));

    const schedule = generateSchedule(
      participantList,
      event.courtCount,
      event.startTime,
      event.endTime,
      event.matchDuration,
      event.breakDuration,
      {
        pairVariation: event.pairVariation,
        opponentVariation: event.opponentVariation,
        levelMatching: event.levelMatching
      }
    );

    db.updateEvent(id, { schedule });

    res.json({ schedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'スケジュール生成に失敗しました' });
  }
});

export default router;
