export interface Participant {
  id?: number;
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

export interface EventData {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  matchDuration: number;
  breakDuration: number;
  courtCount: number;
  pairVariation: boolean;
  opponentVariation: boolean;
  levelMatching: boolean;
  participants: Participant[];
  schedule: Round[] | null;
}
