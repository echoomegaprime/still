import { create } from "zustand";
import { persist } from "zustand/middleware";
import { lotsFromRisk, stopDistance } from "./gold";
import {
  buildSampleHistory,
  DEFAULT_PATTERNS,
  DEFAULT_RULES,
  DEFAULT_SETTINGS,
} from "./seed";
import {
  consecutiveLosses,
  currentEquity,
  isSessionLocked,
  sessionPnl,
  sessionTrades,
} from "./stats";
import type {
  DeskAlert,
  DeskState,
  Emotion,
  LockReason,
  Session,
  SessionReview,
  Settings,
  Side,
  Trade,
} from "./types";

export type PlanError =
  | "need-session"
  | "desk-locked"
  | "open-plan"
  | "trade-limit"
  | "rules-unchecked"
  | "name-pattern"
  | "need-thesis"
  | "need-entry-stop"
  | "stop-away"
  | "need-risk"
  | "risk-too-big"
  | "stand-down";

export const PLAN_ERROR_KEY = {
  "need-session": "errNeedSession",
  "desk-locked": "errDeskLocked",
  "open-plan": "errOpenPlan",
  "trade-limit": "errTradeLimit",
  "rules-unchecked": "errRules",
  "name-pattern": "errNamePattern",
  "need-thesis": "errThesis",
  "need-entry-stop": "errEntryStop",
  "stop-away": "errStopAway",
  "need-risk": "errRisk",
  "risk-too-big": "errRiskBig",
  "stand-down": "errStandDown",
} as const;

export type PlanInput = {
  side: Side;
  patternId: string;
  entry: number;
  stop: number;
  target?: number;
  riskUsd: number;
  sizeUsd: number;
  emotion: Emotion;
  thesis: string;
  followedRules: Record<string, boolean>;
};

type StillStore = DeskState & {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  completeOnboarding: (settings: Partial<Settings>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateRule: (id: string, text: string) => void;
  addRule: (text: string) => void;
  removeRule: (id: string) => void;
  resetSample: () => void;
  wipeToBlank: () => void;
  openSession: () => Session;
  endSession: () => void;
  lockDesk: (reason: LockReason, minutes?: number) => void;
  unlockDesk: () => void;
  completeReview: (review: Omit<SessionReview, "completedAt">) => void;
  planTrade: (input: PlanInput) => Trade | { error: PlanError };
  closeTrade: (
    id: string,
    input: { exit: number; pnl: number; notes: string; followedRules: Record<string, boolean> },
  ) => void;
  cancelTrade: (id: string) => void;
  pushAlert: (alert: Omit<DeskAlert, "id" | "at" | "read">) => void;
  markAlertsRead: () => void;
  setLastWatchmanKey: (key: string) => void;
  startTutorial: () => void;
  finishTutorial: () => void;
  claimDesk: (input: {
    startFresh: boolean;
    settings: Partial<Settings>;
  }) => void;
};

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function sampleState(): DeskState {
  const history = buildSampleHistory();
  const lastPnl = history.trades.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
  return {
    onboarded: true,
    settings: {
      ...DEFAULT_SETTINGS,
      trueCapital: DEFAULT_SETTINGS.trueCapital + lastPnl,
    },
    rules: DEFAULT_RULES,
    patterns: DEFAULT_PATTERNS,
    trades: history.trades,
    sessions: history.sessions,
    alerts: [],
    lastWatchmanKey: "",
  };
}

function blankState(): DeskState {
  return {
    onboarded: false,
    settings: DEFAULT_SETTINGS,
    rules: DEFAULT_RULES,
    patterns: DEFAULT_PATTERNS,
    trades: [],
    sessions: [],
    alerts: [],
    lastWatchmanKey: "",
  };
}

function activeSession(sessions: Session[]): Session | undefined {
  return [...sessions].reverse().find((s) => !s.endedAt);
}

export function getActiveSession(sessions: Session[]): Session | undefined {
  return activeSession(sessions);
}

export const useStill = create<StillStore>()(
  persist(
    (set, get) => ({
      ...sampleState(),
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),

      completeOnboarding: (settings) =>
        set((state) => ({
          onboarded: true,
          settings: { ...state.settings, ...settings },
        })),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      updateRule: (id, text) =>
        set((state) => ({
          rules: state.rules.map((r) => (r.id === id ? { ...r, text } : r)),
        })),

      addRule: (text) =>
        set((state) => ({
          rules: [
            ...state.rules,
            { id: uid("rule"), text: text.trim(), required: true },
          ],
        })),

      removeRule: (id) =>
        set((state) => ({ rules: state.rules.filter((r) => r.id !== id) })),

      resetSample: () =>
        set((state) => {
          const next = sampleState();
          return {
            ...next,
            hydrated: true,
            settings: {
              ...next.settings,
              locale: state.settings.locale ?? "en",
              phone: state.settings.phone,
              email: state.settings.email,
              alertSms: state.settings.alertSms,
              alertEmail: state.settings.alertEmail,
              alertPush: state.settings.alertPush,
              alertOnSit: state.settings.alertOnSit,
              alertOnLevel: state.settings.alertOnLevel,
              alertOnLondon: state.settings.alertOnLondon,
              tutorialDone: state.settings.tutorialDone,
              claimed: state.settings.claimed,
            },
            alerts: [],
            lastWatchmanKey: "",
          };
        }),

      wipeToBlank: () =>
        set((state) => ({
          ...blankState(),
          onboarded: true,
          hydrated: true,
          settings: {
            ...DEFAULT_SETTINGS,
            locale: state.settings.locale ?? "en",
            phone: state.settings.phone,
            email: state.settings.email,
            alertSms: state.settings.alertSms,
            alertEmail: state.settings.alertEmail,
            alertPush: state.settings.alertPush,
            alertOnSit: state.settings.alertOnSit,
            alertOnLevel: state.settings.alertOnLevel,
            alertOnLondon: state.settings.alertOnLondon,
            tutorialDone: true,
            claimed: true,
          },
          alerts: [],
          lastWatchmanKey: "",
        })),

      openSession: () => {
        const state = get();
        const existing = activeSession(state.sessions);
        if (existing && !existing.endedAt) return existing;
        const session: Session = {
          id: uid("ses"),
          startedAt: new Date().toISOString(),
          startingEquity: state.settings.trueCapital,
          maxLossUsd: Math.round(
            (state.settings.trueCapital * state.settings.defaultMaxLossPct) / 100,
          ),
          maxTrades: state.settings.defaultMaxTrades,
          maxConsecutiveLosses: state.settings.defaultMaxConsecutiveLosses,
          cooldownMinutes: state.settings.defaultCooldownMinutes,
        };
        set({ sessions: [...state.sessions, session] });
        return session;
      },

      endSession: () =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.endedAt ? s : { ...s, endedAt: new Date().toISOString() },
          ),
        })),

      lockDesk: (reason, minutes) =>
        set((state) => {
          const current = activeSession(state.sessions);
          if (!current) return state;
          const wait = minutes ?? current.cooldownMinutes;
          return {
            sessions: state.sessions.map((s) =>
              s.id === current.id
                ? {
                    ...s,
                    lockReason: reason,
                    lockedUntil: new Date(Date.now() + wait * 60_000).toISOString(),
                  }
                : s,
            ),
          };
        }),

      unlockDesk: () =>
        set((state) => {
          const current = activeSession(state.sessions);
          if (!current) return state;
          return {
            sessions: state.sessions.map((s) =>
              s.id === current.id
                ? { ...s, lockReason: undefined, lockedUntil: undefined }
                : s,
            ),
          };
        }),

      completeReview: (review) =>
        set((state) => {
          const current = activeSession(state.sessions);
          if (!current) return state;
          return {
            sessions: state.sessions.map((s) =>
              s.id === current.id
                ? {
                    ...s,
                    review: { ...review, completedAt: new Date().toISOString() },
                    lockReason: undefined,
                    lockedUntil: undefined,
                    endedAt: new Date().toISOString(),
                  }
                : s,
            ),
          };
        }),

      planTrade: (input) => {
        const state = get();
        let session = activeSession(state.sessions);
        if (!session) session = get().openSession();
        session = activeSession(get().sessions);
        if (!session) return { error: "need-session" };
        if (isSessionLocked(session)) {
          return { error: "desk-locked" };
        }
        const open = get().trades.filter(
          (t) => t.sessionId === session!.id && t.status !== "closed",
        );
        if (open.length > 0) return { error: "open-plan" };
        const taken = sessionTrades(get().trades, session.id).filter((t) => t.status === "closed");
        if (taken.length >= session.maxTrades) {
          get().lockDesk("max-trades", session.cooldownMinutes);
          return { error: "trade-limit" };
        }
        const required = get().rules.filter((r) => r.required);
        const missed = required.filter((r) => !input.followedRules[r.id]);
        if (missed.length > 0) {
          return { error: "rules-unchecked" };
        }
        if (!input.patternId) return { error: "name-pattern" };
        if (!input.thesis.trim()) return { error: "need-thesis" };
        if (input.entry <= 0 || input.stop <= 0) return { error: "need-entry-stop" };
        const dist = stopDistance(input.entry, input.stop);
        if (dist <= 0) return { error: "stop-away" };
        if (input.riskUsd <= 0) return { error: "need-risk" };
        const maxRisk = (get().settings.trueCapital * get().settings.maxRiskPct) / 100;
        if (input.riskUsd > maxRisk * 1.01) {
          return { error: "risk-too-big" };
        }
        if (["revenge", "fear", "fomo"].includes(input.emotion)) {
          return { error: "stand-down" };
        }

        const trade: Trade = {
          id: uid("t"),
          sessionId: session.id,
          status: "open",
          openedAt: new Date().toISOString(),
          side: input.side,
          patternId: input.patternId,
          entry: input.entry,
          stop: input.stop,
          target: input.target,
          sizeUsd: input.sizeUsd,
          riskUsd: input.riskUsd,
          lots: lotsFromRisk(input.riskUsd, dist),
          followedRules: input.followedRules,
          emotion: input.emotion,
          thesis: input.thesis.trim(),
          notes: "",
          brokeRuleAfterLoss: false,
        };
        set({ trades: [...get().trades, trade] });
        return trade;
      },

      closeTrade: (id, input) => {
        const state = get();
        const trade = state.trades.find((t) => t.id === id);
        if (!trade) return;
        const session = state.sessions.find((s) => s.id === trade.sessionId);
        const prior = session
          ? sessionTrades(state.trades, session.id).filter((t) => t.id !== id)
          : [];
        const lastWasLoss =
          [...prior]
            .filter((t) => t.status === "closed")
            .sort((a, b) =>
              (a.closedAt ?? "").localeCompare(b.closedAt ?? ""),
            )
            .at(-1)?.pnl ?? 0;
        const brokeRuleAfterLoss = lastWasLoss < 0;

        const nextTrades = state.trades.map((t) =>
          t.id === id
            ? {
                ...t,
                status: "closed" as const,
                closedAt: new Date().toISOString(),
                exit: input.exit,
                pnl: input.pnl,
                notes: input.notes,
                followedRules: input.followedRules,
                brokeRuleAfterLoss,
              }
            : t,
        );

        const nextCapital = currentEquity(
          session?.startingEquity ?? state.settings.trueCapital,
          nextTrades.filter((t) => !session || t.sessionId === session.id),
        );

        set({
          trades: nextTrades,
          settings: {
            ...state.settings,
            trueCapital: Math.max(
              0,
              state.settings.trueCapital + input.pnl,
            ),
          },
        });

        if (!session) return;
        const sessRows = sessionTrades(nextTrades, session.id);
        const pnl = sessionPnl(nextTrades, session);
        const losses = consecutiveLosses(sessRows);
        if (pnl <= -session.maxLossUsd) {
          get().lockDesk("max-loss", session.cooldownMinutes);
          return;
        }
        if (losses >= session.maxConsecutiveLosses) {
          get().lockDesk("consecutive-losses", session.cooldownMinutes);
          return;
        }
        if (input.pnl < 0) {
          get().lockDesk("cooldown", session.cooldownMinutes);
        }
        void nextCapital;
      },

      cancelTrade: (id) =>
        set((state) => ({
          trades: state.trades.filter((t) => t.id !== id || t.status === "closed"),
        })),

      pushAlert: (alert) =>
        set((state) => ({
          alerts: [
            {
              ...alert,
              id: uid("al"),
              at: new Date().toISOString(),
              read: false,
            },
            ...state.alerts,
          ].slice(0, 40),
        })),

      markAlertsRead: () =>
        set((state) => ({
          alerts: state.alerts.map((a) => ({ ...a, read: true })),
        })),

      setLastWatchmanKey: (key) => set({ lastWatchmanKey: key }),

      startTutorial: () =>
        set((state) => ({ settings: { ...state.settings, tutorialDone: false } })),

      finishTutorial: () =>
        set((state) => ({ settings: { ...state.settings, tutorialDone: true } })),

      claimDesk: ({ startFresh, settings }) => {
        const locale = get().settings.locale;
        if (startFresh) {
          const next = blankState();
          set({
            ...next,
            onboarded: true,
            hydrated: true,
            settings: {
              ...DEFAULT_SETTINGS,
              ...settings,
              locale: settings.locale ?? locale,
              claimed: true,
              tutorialDone: true,
            },
          });
          return;
        }
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings,
            claimed: true,
            tutorialDone: true,
          },
        }));
      },
    }),
    {
      name: "still-gold-desk-v1",
      partialize: (state) => ({
        onboarded: state.onboarded,
        settings: state.settings,
        rules: state.rules,
        patterns: state.patterns,
        trades: state.trades,
        sessions: state.sessions,
        alerts: state.alerts,
        lastWatchmanKey: state.lastWatchmanKey,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DeskState>;
        return {
          ...current,
          ...p,
          settings: {
            ...DEFAULT_SETTINGS,
            ...p.settings,
            claimed: p.settings?.claimed ?? Boolean(p.settings?.tutorialDone),
          },
          alerts: p.alerts ?? [],
          lastWatchmanKey: p.lastWatchmanKey ?? "",
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function useActiveSession(): Session | undefined {
  return useStill((s) => getActiveSession(s.sessions));
}
