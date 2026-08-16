export type Side = "long" | "short";
export type Emotion = "calm" | "fear" | "revenge" | "fomo";
export type Currency = "USD" | "NPR";
export type Locale = "en" | "np";
export type PatternBias = "bull" | "bear" | "both";
export type LockReason =
  | "max-loss"
  | "max-trades"
  | "consecutive-losses"
  | "manual"
  | "cooldown"
  | "weekend-standdown";
export type TradeStatus = "planned" | "open" | "closed";

export type Rule = {
  id: string;
  text: string;
  required: boolean;
};

export type Pattern = {
  id: string;
  name: string;
  bias: PatternBias;
  summary: string;
  tells: string[];
  invalidWhen: string;
};

export type Trade = {
  id: string;
  sessionId: string;
  status: TradeStatus;
  openedAt: string;
  closedAt?: string;
  side: Side;
  patternId: string;
  entry: number;
  stop: number;
  target?: number;
  exit?: number;
  sizeUsd: number;
  riskUsd: number;
  lots: number;
  pnl?: number;
  followedRules: Record<string, boolean>;
  emotion: Emotion;
  thesis: string;
  notes: string;
  brokeRuleAfterLoss: boolean;
};

export type Session = {
  id: string;
  startedAt: string;
  endedAt?: string;
  startingEquity: number;
  maxLossUsd: number;
  maxTrades: number;
  maxConsecutiveLosses: number;
  cooldownMinutes: number;
  lockReason?: LockReason;
  lockedUntil?: string;
  review?: SessionReview;
};

export type SessionReview = {
  completedAt: string;
  brokeARule: boolean;
  patternWasValid: boolean;
  nextTime: string;
};

export type Settings = {
  displayName: string;
  trueCapital: number;
  friendsStory: number;
  currency: Currency;
  locale: Locale;
  maxRiskPct: number;
  defaultMaxLossPct: number;
  defaultMaxTrades: number;
  defaultMaxConsecutiveLosses: number;
  defaultCooldownMinutes: number;
  phone: string;
  email: string;
  alertSms: boolean;
  alertEmail: boolean;
  alertPush: boolean;
  alertOnSit: boolean;
  alertOnLevel: boolean;
  alertOnLondon: boolean;
  tutorialDone: boolean;
  claimed: boolean;
};

export type DeskState = {
  onboarded: boolean;
  settings: Settings;
  rules: Rule[];
  patterns: Pattern[];
  trades: Trade[];
  sessions: Session[];
  alerts: DeskAlert[];
  lastWatchmanKey: string;
};

export type AlertKind = "sit" | "level" | "london" | "test";

export type DeskAlert = {
  id: string;
  at: string;
  kind: AlertKind;
  title: string;
  body: string;
  read: boolean;
};
