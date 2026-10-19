import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Question } from '@/data/questions';

export type Vote = 'norm' | 'strem';

export interface GameSettings {
  noRepeatInRound: boolean;
}

export interface RoundState {
  deck: number[];
  currentQuestionId: number | null;
  currentIndex: number;
  totalShown: number;
  votes: Record<number, Vote>;
  finished: boolean;
}

const SETTINGS_KEY = 'norm-strem-settings';
const ROUND_KEY = 'norm-strem-round';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { noRepeatInRound: parsed.noRepeatInRound ?? true };
    }
  } catch {
    // ignore
  }
  return { noRepeatInRound: true };
}

function loadRound(): RoundState | null {
  try {
    const raw = localStorage.getItem(ROUND_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.deck && Array.isArray(parsed.deck) && parsed.deck.length > 0) {
        return {
          deck: parsed.deck,
          currentQuestionId: parsed.currentQuestionId ?? null,
          currentIndex: parsed.currentIndex ?? 0,
          totalShown: parsed.totalShown ?? 0,
          votes: parsed.votes ?? {},
          finished: parsed.finished ?? false,
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function useGame(questions: Question[]) {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [round, setRound] = useState<RoundState | null>(loadRound);
  const [animKey, setAnimKey] = useState(0);
  const roundRef = useRef(round);
  roundRef.current = round;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      if (round) {
        localStorage.setItem(ROUND_KEY, JSON.stringify(round));
      } else {
        localStorage.removeItem(ROUND_KEY);
      }
    } catch {
      // ignore
    }
  }, [round]);

  const currentQuestion = useMemo<Question | null>(() => {
    if (!round || round.currentQuestionId === null) return null;
    return questionsRef.current.find((q) => q.id === round.currentQuestionId) ?? null;
  }, [round, questions]);

  const advance = useCallback((r: RoundState, votes: Record<number, Vote>) => {
    if (settings.noRepeatInRound) {
      const nextIdx = r.currentIndex + 1;
      if (nextIdx >= r.deck.length) {
        setRound({
          ...r,
          votes,
          totalShown: r.totalShown + 1,
          currentIndex: r.deck.length - 1,
          currentQuestionId: r.deck[r.deck.length - 1],
          finished: true,
        });
        setAnimKey((k) => k + 1);
        return;
      }
      const nextId = r.deck[nextIdx];
      setRound({
        ...r,
        votes,
        currentIndex: nextIdx,
        currentQuestionId: nextId,
        totalShown: r.totalShown + 1,
      });
    } else {
      if (questionsRef.current.length <= 1) {
        setRound({ ...r, votes, currentQuestionId: questionsRef.current[0]?.id ?? null, totalShown: r.totalShown + 1 });
        setAnimKey((k) => k + 1);
        return;
      }
      let candidate = questionsRef.current[Math.floor(Math.random() * questionsRef.current.length)];
      if (candidate.id === r.currentQuestionId) {
        candidate = questionsRef.current.find((q) => q.id !== r.currentQuestionId) ?? candidate;
      }
      setRound({
        ...r,
        votes,
        currentQuestionId: candidate.id,
        totalShown: r.totalShown + 1,
      });
    }
    setAnimKey((k) => k + 1);
  }, [settings.noRepeatInRound]);

  const startNewRound = useCallback(() => {
    if (questionsRef.current.length === 0) return;
    const deck = shuffle(questionsRef.current.map((q) => q.id));
    const firstId = deck[0];
    setRound({
      deck,
      currentQuestionId: firstId,
      currentIndex: 0,
      totalShown: 1,
      votes: {},
      finished: false,
    });
    setAnimKey((k) => k + 1);
  }, []);

  const continueRound = useCallback(() => {
    const r = roundRef.current;
    if (!r || r.finished) {
      startNewRound();
      return;
    }
    setAnimKey((k) => k + 1);
  }, [startNewRound]);

  const voteQuestion = useCallback((vote: Vote) => {
    const r = roundRef.current;
    if (!r || r.currentQuestionId === null) {
      startNewRound();
      return;
    }
    const votes = { ...r.votes, [r.currentQuestionId]: vote };
    advance(r, votes);
  }, [advance, startNewRound]);

  const skipQuestion = useCallback(() => {
    const r = roundRef.current;
    if (!r) {
      startNewRound();
      return;
    }
    advance(r, { ...r.votes });
  }, [advance, startNewRound]);

  const nextQuestion = useCallback(() => {
    skipQuestion();
  }, [skipQuestion]);

  const randomQuestion = useCallback(() => {
    const r = roundRef.current;
    if (!r) {
      startNewRound();
      return;
    }
    if (questionsRef.current.length <= 1) return;

    if (settings.noRepeatInRound) {
      const remainingIds = r.deck.slice(r.currentIndex + 1);

      let candidates: number[];
      if (remainingIds.length > 0) {
        candidates = remainingIds;
      } else {
        startNewRound();
        return;
      }

      const randomId = candidates[Math.floor(Math.random() * candidates.length)];

      const newDeck = [...r.deck];
      const pickedIdx = newDeck.indexOf(randomId);
      if (pickedIdx > r.currentIndex + 1) {
        const tmp = newDeck[r.currentIndex + 1];
        newDeck[r.currentIndex + 1] = randomId;
        newDeck[pickedIdx] = tmp;
      }

      const nextIdx = r.currentIndex + 1;
      setRound({
        ...r,
        deck: newDeck,
        currentIndex: nextIdx,
        currentQuestionId: randomId,
        totalShown: r.totalShown + 1,
      });
    } else {
      let candidate = questionsRef.current[Math.floor(Math.random() * questionsRef.current.length)];
      if (candidate.id === r.currentQuestionId) {
        candidate = questionsRef.current.find((q) => q.id !== r.currentQuestionId) ?? candidate;
      }
      setRound({
        ...r,
        currentQuestionId: candidate.id,
        totalShown: r.totalShown + 1,
      });
    }
    setAnimKey((k) => k + 1);
  }, [settings.noRepeatInRound, startNewRound]);

  const shuffleDeck = useCallback(() => {
    const r = roundRef.current;
    if (questionsRef.current.length === 0) return;
    const newDeck = shuffle(questionsRef.current.map((q) => q.id));
    if (r && r.currentQuestionId !== null) {
      const idx = newDeck.indexOf(r.currentQuestionId);
      if (idx > 0) {
        [newDeck[0], newDeck[idx]] = [newDeck[idx], newDeck[0]];
      }
      setRound({
        deck: newDeck,
        currentQuestionId: newDeck[0],
        currentIndex: 0,
        totalShown: r.totalShown,
        votes: r.votes,
        finished: false,
      });
    } else {
      setRound({
        deck: newDeck,
        currentQuestionId: newDeck[0],
        currentIndex: 0,
        totalShown: 1,
        votes: {},
        finished: false,
      });
      setAnimKey((k) => k + 1);
    }
  }, []);

  const endRoundEarly = useCallback(() => {
    const r = roundRef.current;
    if (!r) return;
    setRound({ ...r, finished: true });
    setAnimKey((k) => k + 1);
  }, []);

  const restartGame = useCallback(() => {
    setRound(null);
    startNewRound();
  }, [startNewRound]);

  const exitToHome = useCallback(() => {
    setRound(null);
  }, []);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const totalQuestions = questions.length;
  const seenCount = round ? round.currentIndex + 1 : 0;
  const roundComplete = round?.finished ?? false;
  const hasSavedRound = round !== null && !round.finished;

  return {
    settings,
    updateSettings,
    round,
    currentQuestion,
    animKey,
    totalQuestions,
    seenCount,
    roundComplete,
    hasSavedRound,
    savedProgress: round ? round.currentIndex : 0,
    savedDeckLength: round ? round.deck.length : 0,
    startNewRound,
    continueRound,
    nextQuestion,
    randomQuestion,
    skipQuestion,
    voteQuestion,
    shuffleDeck,
    endRoundEarly,
    restartGame,
    exitToHome,
  };
}
