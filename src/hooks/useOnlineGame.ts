import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_QUESTIONS } from '@/data/questions';

export type Phase = 'lobby' | 'voting' | 'results' | 'finished';
export type Vote = 'norm' | 'strem';

export interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  host_name: string;
  question_count: number;
  current_index: number;
  phase: Phase;
  ready_deadline: string | null;
  timer_enabled: boolean;
  timer_seconds: number;
}

export interface PlayerRow {
  id: string;
  room_id: string;
  player_id: string;
  name: string;
  vote: Vote | null;
  ready: boolean;
  joined_at: string;
}

export interface QuestionStateRow {
  id: string;
  room_id: string;
  slot_index: number;
  question_text: string;
}

export interface VoteHistoryRow {
  id: string;
  room_id: string;
  slot_index: number;
  player_id: string;
  player_name: string;
  vote: Vote;
}

export interface OnlineSession {
  roomId: string;
  code: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
}

const SESSION_KEY = 'norm-strem-online-session';
const NAME_KEY = 'norm-strem-player-name';

function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function loadSession(): OnlineSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as OnlineSession;
  } catch {
    // ignore
  }
  return null;
}

function saveSession(s: OnlineSession | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function genPlayerId(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useOnlineGame() {
  const [session, setSession] = useState<OnlineSession | null>(loadSession);
  const [name, setNameState] = useState<string>(loadName);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [questionStates, setQuestionStates] = useState<QuestionStateRow[]>([]);
  const [voteHistory, setVoteHistory] = useState<VoteHistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const roomRef = useRef(room);
  roomRef.current = room;
  const playersRef = useRef(players);
  playersRef.current = players;
  const voteHistoryRef = useRef(voteHistory);
  voteHistoryRef.current = voteHistory;

  const setName = useCallback((n: string) => {
    setNameState(n);
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch {
      // ignore
    }
  }, []);

  // Fetch full state for a room
  const fetchRoomState = useCallback(async (roomId: string) => {
    const [{ data: roomData }, { data: playerData }, { data: qsData }, { data: vhData }] = await Promise.all([
      supabase.from('online_rooms').select('*').eq('id', roomId).maybeSingle(),
      supabase.from('online_players').select('*').eq('room_id', roomId).order('joined_at', { ascending: true }),
      supabase.from('online_question_state').select('*').eq('room_id', roomId).order('slot_index', { ascending: true }),
      supabase.from('online_votes').select('*').eq('room_id', roomId).order('slot_index', { ascending: true }),
    ]);
    if (roomData) setRoom(roomData as RoomRow);
    if (playerData) setPlayers(playerData as PlayerRow[]);
    if (qsData) setQuestionStates(qsData as QuestionStateRow[]);
    if (vhData) setVoteHistory(vhData as VoteHistoryRow[]);
  }, []);

  // Subscribe to realtime updates for a room
  const subscribeRoom = useCallback(
    (roomId: string) => {
      const channel = supabase.channel(`room-${roomId}`);
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'online_rooms', filter: `id=eq.${roomId}` }, (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRoom(payload.new as RoomRow);
          } else if (payload.eventType === 'DELETE') {
            setRoom(null);
            setPlayers([]);
            setQuestionStates([]);
            saveSession(null);
            setSession(null);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'online_players', filter: `room_id=eq.${roomId}` }, () => {
          supabase
            .from('online_players')
            .select('*')
            .eq('room_id', roomId)
            .order('joined_at', { ascending: true })
            .then(({ data }) => {
              if (data) setPlayers(data as PlayerRow[]);
            });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'online_question_state', filter: `room_id=eq.${roomId}` }, () => {
          supabase
            .from('online_question_state')
            .select('*')
            .eq('room_id', roomId)
            .order('slot_index', { ascending: true })
            .then(({ data }) => {
              if (data) setQuestionStates(data as QuestionStateRow[]);
            });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'online_votes', filter: `room_id=eq.${roomId}` }, () => {
          supabase
            .from('online_votes')
            .select('*')
            .eq('room_id', roomId)
            .order('slot_index', { ascending: true })
            .then(({ data }) => {
              if (data) setVoteHistory(data as VoteHistoryRow[]);
            });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    []
  );

  // On session change: fetch room state + subscribe
  useEffect(() => {
    if (!session) {
      setRoom(null);
      setPlayers([]);
      setQuestionStates([]);
      return;
    }
    let unsub: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      await fetchRoomState(session.roomId);
      if (cancelled) return;
      unsub = subscribeRoom(session.roomId);
    })();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [session, fetchRoomState, subscribeRoom]);

  const createRoom = useCallback(
    async (hostName: string, questionCount: number) => {
      setError(null);
      setLoading(true);
      try {
        const trimmed = hostName.trim();
        if (!trimmed) {
          setError('Введите имя');
          return;
        }
        setName(trimmed);
        const playerId = genPlayerId();
        let code = genCode();
        // ensure unique code
        for (let attempts = 0; attempts < 5; attempts++) {
          const { data: existing } = await supabase.from('online_rooms').select('id').eq('code', code).maybeSingle();
          if (!existing) break;
          code = genCode();
        }

        const { data: roomData, error: roomErr } = await supabase
          .from('online_rooms')
          .insert({
            code,
            host_id: playerId,
            host_name: trimmed,
            question_count: questionCount,
            current_index: 0,
            phase: 'lobby',
          })
          .select()
          .single();
        if (roomErr || !roomData) {
          setError('Не удалось создать комнату');
          return;
        }

        const roomId = (roomData as RoomRow).id;
        const { error: playerErr } = await supabase
          .from('online_players')
          .insert({ room_id: roomId, player_id: playerId, name: trimmed });
        if (playerErr) {
          setError('Не удалось присоединиться к комнате');
          return;
        }

        const newSession: OnlineSession = {
          roomId,
          code,
          playerId,
          playerName: trimmed,
          isHost: true,
        };
        saveSession(newSession);
        setSession(newSession);
      } finally {
        setLoading(false);
      }
    },
    [setName]
  );

  const joinRoom = useCallback(
    async (code: string, playerName: string) => {
      setError(null);
      setLoading(true);
      try {
        const trimmedName = playerName.trim();
        const trimmedCode = code.trim().toUpperCase();
        if (!trimmedName) {
          setError('Введите имя');
          return;
        }
        if (!trimmedCode) {
          setError('Введите код комнаты');
          return;
        }
        setName(trimmedName);
        const { data: roomData, error: roomErr } = await supabase
          .from('online_rooms')
          .select('*')
          .eq('code', trimmedCode)
          .maybeSingle();
        if (roomErr || !roomData) {
          setError('Комната не найдена');
          return;
        }
        const roomRow = roomData as RoomRow;
        if (roomRow.phase === 'finished') {
          setError('Эта игра уже закончилась');
          return;
        }
        const playerId = genPlayerId();
        const { error: playerErr } = await supabase
          .from('online_players')
          .insert({ room_id: roomRow.id, player_id: playerId, name: trimmedName });
        if (playerErr) {
          setError('Не удалось присоединиться');
          return;
        }
        const newSession: OnlineSession = {
          roomId: roomRow.id,
          code: roomRow.code,
          playerId,
          playerName: trimmedName,
          isHost: false,
        };
        saveSession(newSession);
        setSession(newSession);
      } finally {
        setLoading(false);
      }
    },
    [setName]
  );

  const leaveRoom = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    await supabase.from('online_players').delete().eq('room_id', s.roomId).eq('player_id', s.playerId);
    if (s.isHost) {
      await supabase.from('online_rooms').delete().eq('id', s.roomId);
    }
    saveSession(null);
    setSession(null);
  }, []);

  const startGame = useCallback(async () => {
    const s = sessionRef.current;
    const r = roomRef.current;
    if (!s || !r || !s.isHost) return;

    const count = Math.min(r.question_count, DEFAULT_QUESTIONS.length);
    const picked = shuffle(DEFAULT_QUESTIONS).slice(0, count);

    const rows = picked.map((q, i) => ({
      room_id: s.roomId,
      slot_index: i,
      question_text: q.text,
    }));
    await supabase.from('online_question_state').delete().eq('room_id', s.roomId);
    await supabase.from('online_question_state').insert(rows);

    await supabase.from('online_players').update({ ready: false, vote: null }).eq('room_id', s.roomId);

    await supabase
      .from('online_rooms')
      .update({ current_index: 0, phase: 'voting', ready_deadline: null })
      .eq('id', s.roomId);
  }, []);

  const castVote = useCallback(async (vote: Vote) => {
    const s = sessionRef.current;
    if (!s) return;
    await supabase
      .from('online_players')
      .update({ vote })
      .eq('room_id', s.roomId)
      .eq('player_id', s.playerId);
  }, []);

  const setReady = useCallback(async (ready: boolean) => {
    const s = sessionRef.current;
    if (!s) return;
    await supabase.rpc('online_mark_ready', {
      p_room_id: s.roomId,
      p_player_id: s.playerId,
      p_ready: ready,
    });
  }, []);

  // Host-only: poll the server when a deadline exists. Server now()
  // decides whether to advance, so browser clock skew can only cause a
  // harmless not-ready retry — never a freeze. Polling continues until the
  // room phase/deadline changes (observed via realtime setRoom).
  useEffect(() => {
    if (!session?.isHost) return;
    const r = roomRef.current;
    if (!r || r.phase !== 'voting' || !r.ready_deadline) return;

    const interval = setInterval(async () => {
      await supabase.rpc('advance_online_round', { p_room_id: r.id });
    }, 1000);

    return () => clearInterval(interval);
  }, [room, session]);

  const updateTimer = useCallback(async (enabled: boolean, seconds: number) => {
    const s = sessionRef.current;
    const r = roomRef.current;
    if (!s || !r || !s.isHost) return;
    await supabase
      .from('online_rooms')
      .update({ timer_enabled: enabled, timer_seconds: seconds })
      .eq('id', s.roomId);
  }, []);

  const playAgain = useCallback(async () => {
    const s = sessionRef.current;
    const r = roomRef.current;
    if (!s || !r || !s.isHost) return;
    await supabase.from('online_question_state').delete().eq('room_id', s.roomId);
    await supabase.from('online_votes').delete().eq('room_id', s.roomId);
    await supabase.from('online_players').update({ ready: false, vote: null }).eq('room_id', s.roomId);
    await supabase
      .from('online_rooms')
      .update({ current_index: 0, phase: 'lobby', ready_deadline: null })
      .eq('id', s.roomId);
  }, []);

  return {
    session,
    name,
    setName,
    room,
    players,
    questionStates,
    voteHistory,
    error,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    castVote,
    setReady,
    updateTimer,
    playAgain,
  };
}
