type ChallengeStatus = 'created' | 'offline' | 'canceled' | 'declined' | 'accepted';

export interface ChallengeUser {
  id: string;
  rating: number;
  provisional?: boolean
}

export interface TimeControl {
  type: 'clock' | 'correspondence' | 'unlimited';
  show?: string;
  daysPerTurn?: number;
  limit: number;
  increment: number;
}

export interface Challenge {
  id: string
  direction: 'in' | 'out'
  status: ChallengeStatus
  challenger?: ChallengeUser
  destUser?: ChallengeUser
  variant: Variant
  initialFen: string
  rated: boolean
  timeControl: TimeControl
  color: Color
  perf: {
    icon: string
    name: string
  }
}

export interface ChallengesData {
  in: Array<Challenge>
  out: Array<Challenge>
}

