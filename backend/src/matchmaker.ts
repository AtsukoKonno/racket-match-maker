export interface Participant {
  id: number;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  ruleUnderstanding: 'knows' | 'newbie';
}

export interface Match {
  court: number;
  team1: [Participant, Participant];
  team2: [Participant, Participant];
}

export interface Round {
  roundNumber: number;
  startTime: string;
  endTime: string;
  matches: Match[];
  resting: Participant[];
}

interface Options {
  pairVariation: boolean;
  opponentVariation: boolean;
  levelMatching: boolean;
}

const levelScore = { beginner: 1, intermediate: 2, advanced: 3 };

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pairKey(a: Participant, b: Participant): string {
  return [a.id, b.id].sort((x, y) => x - y).join('-');
}

function matchupKey(t1: [Participant, Participant], t2: [Participant, Participant]): string {
  const ids = [...t1.map(p => p.id), ...t2.map(p => p.id)].sort((a, b) => a - b);
  return ids.join('-');
}

export function generateSchedule(
  participants: Participant[],
  courtCount: number,
  startTime: string,
  endTime: string,
  matchDuration: number,
  breakDuration: number,
  options: Options
): Round[] {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const roundDuration = matchDuration + breakDuration;
  const roundCount = Math.floor(totalMinutes / roundDuration);

  if (roundCount <= 0 || participants.length < 4) {
    return [];
  }

  const playersPerRound = courtCount * 4;
  const usedPairs = new Map<string, number>();
  const usedMatchups = new Map<string, number>();
  const rounds: Round[] = [];

  for (let r = 0; r < roundCount; r++) {
    const roundStartMinutes = startH * 60 + startM + r * roundDuration;
    const roundEndMinutes = roundStartMinutes + matchDuration;
    const roundStartTime = `${Math.floor(roundStartMinutes / 60).toString().padStart(2, '0')}:${(roundStartMinutes % 60).toString().padStart(2, '0')}`;
    const roundEndTime = `${Math.floor(roundEndMinutes / 60).toString().padStart(2, '0')}:${(roundEndMinutes % 60).toString().padStart(2, '0')}`;

    const { matches, resting } = assignRound(
      participants,
      courtCount,
      usedPairs,
      usedMatchups,
      options
    );

    rounds.push({
      roundNumber: r + 1,
      startTime: roundStartTime,
      endTime: roundEndTime,
      matches,
      resting
    });

    // Update usage counts
    for (const match of matches) {
      const pk1 = pairKey(match.team1[0], match.team1[1]);
      const pk2 = pairKey(match.team2[0], match.team2[1]);
      usedPairs.set(pk1, (usedPairs.get(pk1) || 0) + 1);
      usedPairs.set(pk2, (usedPairs.get(pk2) || 0) + 1);
      const mk = matchupKey(match.team1, match.team2);
      usedMatchups.set(mk, (usedMatchups.get(mk) || 0) + 1);
    }
  }

  return rounds;
}

function assignRound(
  participants: Participant[],
  courtCount: number,
  usedPairs: Map<string, number>,
  usedMatchups: Map<string, number>,
  options: Options
): { matches: Match[]; resting: Participant[] } {
  const playersNeeded = courtCount * 4;
  let shuffled = shuffleArray(participants);

  // Sort by level if level matching is enabled
  if (options.levelMatching) {
    shuffled.sort((a, b) => levelScore[a.level] - levelScore[b.level]);
  }

  const playing = shuffled.slice(0, Math.min(playersNeeded, shuffled.length));
  const resting = shuffled.slice(Math.min(playersNeeded, shuffled.length));

  const matches: Match[] = [];
  const assigned = new Set<number>();

  for (let c = 0; c < courtCount; c++) {
    const available = playing.filter(p => !assigned.has(p.id));
    if (available.length < 4) break;

    const bestMatch = findBestMatch(available, usedPairs, usedMatchups, options);
    if (bestMatch) {
      matches.push({ court: c + 1, ...bestMatch });
      bestMatch.team1.forEach(p => assigned.add(p.id));
      bestMatch.team2.forEach(p => assigned.add(p.id));
    }
  }

  // Add unassigned to resting
  const unassigned = playing.filter(p => !assigned.has(p.id));
  resting.push(...unassigned);

  return { matches, resting };
}

function findBestMatch(
  available: Participant[],
  usedPairs: Map<string, number>,
  usedMatchups: Map<string, number>,
  options: Options
): { team1: [Participant, Participant]; team2: [Participant, Participant] } | null {
  if (available.length < 4) return null;

  let bestScore = Infinity;
  let bestMatch: { team1: [Participant, Participant]; team2: [Participant, Participant] } | null = null;

  // Try multiple random combinations and pick the best
  const attempts = Math.min(100, available.length * 10);

  for (let i = 0; i < attempts; i++) {
    const shuffled = shuffleArray(available).slice(0, 4);
    const [p1, p2, p3, p4] = shuffled;

    // Try different pairings
    const pairings: [[Participant, Participant], [Participant, Participant]][] = [
      [[p1, p2], [p3, p4]],
      [[p1, p3], [p2, p4]],
      [[p1, p4], [p2, p3]]
    ];

    for (const [team1, team2] of pairings) {
      const score = calculateScore(team1, team2, usedPairs, usedMatchups, options);
      if (score < bestScore) {
        bestScore = score;
        bestMatch = { team1, team2 };
      }
    }
  }

  return bestMatch;
}

function calculateScore(
  team1: [Participant, Participant],
  team2: [Participant, Participant],
  usedPairs: Map<string, number>,
  usedMatchups: Map<string, number>,
  options: Options
): number {
  let score = 0;

  // Pair repetition penalty (highest priority)
  if (options.pairVariation) {
    const pk1 = pairKey(team1[0], team1[1]);
    const pk2 = pairKey(team2[0], team2[1]);
    score += (usedPairs.get(pk1) || 0) * 1000;
    score += (usedPairs.get(pk2) || 0) * 1000;
  }

  // Opponent repetition penalty
  if (options.opponentVariation) {
    const mk = matchupKey(team1, team2);
    score += (usedMatchups.get(mk) || 0) * 100;
  }

  // Level balance penalty
  if (options.levelMatching) {
    const team1Level = levelScore[team1[0].level] + levelScore[team1[1].level];
    const team2Level = levelScore[team2[0].level] + levelScore[team2[1].level];
    score += Math.abs(team1Level - team2Level) * 10;
  }

  return score;
}
