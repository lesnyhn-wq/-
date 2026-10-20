import { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Check,
  Clock,
  LogOut,
  RotateCcw,
  Users,
  AlertCircle,
  Home,
  X,
} from 'lucide-react';
import type { useOnlineGame } from '@/hooks/useOnlineGame';
import type { Vote } from '@/hooks/useOnlineGame';

type OnlineHook = ReturnType<typeof useOnlineGame>;

interface OnlineGameScreenProps {
  online: OnlineHook;
  onExit: () => void;
}

export function OnlineGameScreen({ online, onExit }: OnlineGameScreenProps) {
  const { session, room, players, questionStates, castVote, setReady, playAgain, leaveRoom } = online;
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  if (!session || !room) return null;

  const me = players.find((p) => p.player_id === session.playerId);
  const isHost = session.isHost;
  const currentQ = questionStates[room.current_index];
  const myVote = me?.vote ?? null;
  const myReady = me?.ready ?? false;

  const votedCount = players.filter((p) => p.vote).length;
  const readyCount = players.filter((p) => p.ready).length;
  const majority = Math.floor(players.length / 2) + 1;

  const secondsLeft = room.ready_deadline
    ? Math.max(0, Math.ceil((new Date(room.ready_deadline).getTime() - Date.now()) / 1000))
    : null;

  // ===== RESULTS SCREEN =====
  if (room.phase === 'results') {
    // Build per-question vote breakdown from current player votes (final question)
    // and from a snapshot we don't store per-slot — so we aggregate from the
    // realtime players list for the final state. For a full per-question
    // breakdown we'd need historical votes; we show aggregate counts based
    // on the current votes plus a note.
    //
    // Actually, we need per-question results. The votes table only stores
    // the *current* vote. To show per-question breakdown we need to snapshot
    // votes when advancing. Let's fetch from a separate approach: we don't have
    // historical per-slot votes in the DB. We'll display each question with
    // an expandable breakdown of current player votes (which, at results time,
    // reflects the last question). For a proper per-question history we'd
    // need to store votes per slot.
    //
    // Given constraints, we show the questions list with the aggregate
    // breakdown we CAN show: each player's final vote. To get per-question
    // history, let's add a results snapshot.
    //
    // For now, show per-question: the question text with expand showing
    // "data not available" — NO, the user explicitly asked for per-question
    // breakdown. Let me handle this properly below.

    return (
      <OnlineResults
        online={online}
        onExit={onExit}
        expandedQuestion={expandedQuestion}
        setExpandedQuestion={setExpandedQuestion}
      />
    );
  }

  // ===== VOTING SCREEN =====
  return (
    <div className="min-h-[100dvh] flex flex-col px-4 py-5 sm:py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 max-w-2xl w-full mx-auto mb-6">
        <button
          onClick={() => {
            leaveRoom();
            onExit();
          }}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
          aria-label="Выйти"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-medium tabular-nums">
              {room.current_index + 1} из {room.question_count}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              {players.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-purple-400 transition-all duration-500"
              style={{ width: `${((room.current_index + 1) / room.question_count) * 100}%` }}
            />
          </div>
        </div>

        <div className="w-10" />
      </div>

      {/* Question card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-emerald-600/20 to-purple-600/20 blur-xl opacity-60" />
            <div className="relative rounded-3xl border border-white/10 bg-[#15151f] p-6 sm:p-10 md:p-12 shadow-2xl">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Онлайн · Вопрос {room.current_index + 1}
              </span>

              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug text-balance mb-6">
                {currentQ?.question_text ?? 'Загрузка вопроса...'}
              </p>

              {/* Live vote tally */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Норм</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-300 tabular-nums">
                    {players.filter((p) => p.vote === 'norm').length}
                  </p>
                </div>
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-red-400 mb-1">
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Стрем</span>
                  </div>
                  <p className="text-2xl font-black text-red-300 tabular-nums">
                    {players.filter((p) => p.vote === 'strem').length}
                  </p>
                </div>
              </div>

              {/* Players in room */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${
                        p.vote
                          ? p.vote === 'norm'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-red-500/10 text-red-300'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <span className="font-medium">{p.name}</span>
                      {p.vote === 'norm' && <ThumbsUp className="w-3 h-3" />}
                      {p.vote === 'strem' && <ThumbsDown className="w-3 h-3" />}
                      {!p.vote && <span className="text-slate-600">...</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="max-w-2xl w-full mx-auto mt-6 space-y-3">
        {/* Countdown banner */}
        {secondsLeft !== null && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium animate-fade-in-up">
            <Clock className="w-4 h-4" />
            Следующий вопрос через {secondsLeft}с
          </div>
        )}

        {/* Vote buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => castVote('norm')}
            className={`px-5 py-5 rounded-2xl font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
              myVote === 'norm'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_0_25px_-8px_rgba(16,185,129,0.6)] scale-[1.02]'
                : 'bg-white/5 hover:bg-white/10 text-slate-400'
            }`}
          >
            <ThumbsUp className="w-6 h-6" />
            <span>Норм</span>
          </button>
          <button
            onClick={() => castVote('strem')}
            className={`px-5 py-5 rounded-2xl font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
              myVote === 'strem'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_25px_-8px_rgba(239,68,68,0.6)] scale-[1.02]'
                : 'bg-white/5 hover:bg-white/10 text-slate-400'
            }`}
          >
            <ThumbsDown className="w-6 h-6" />
            <span>Стрем</span>
          </button>
        </div>

        {/* Ready button */}
        <button
          onClick={() => setReady(!myReady)}
          disabled={secondsLeft !== null}
          className={`w-full px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
            myReady
              ? 'bg-emerald-600 text-white'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-50'
          }`}
        >
          <Check className="w-5 h-5" />
          {myReady ? 'Готово! Ждём остальных' : `Я готов (${readyCount}/${players.length})`}
        </button>

        <p className="text-xs text-slate-600 text-center tabular-nums">
          Проголосовало: {votedCount} / {players.length} · Готовы: {readyCount} / {players.length}
          {!room.timer_enabled && ' · без таймера'}
        </p>
      </div>
    </div>
  );
}

// ===== Results screen with per-question breakdown =====
function OnlineResults({
  online,
  onExit,
  expandedQuestion,
  setExpandedQuestion,
}: {
  online: OnlineHook;
  onExit: () => void;
  expandedQuestion: number | null;
  setExpandedQuestion: (n: number | null) => void;
}) {
  const { session, room, players, questionStates, voteHistory, playAgain, leaveRoom } = online;

  if (!session || !room) return null;
  const isHost = session.isHost;

  // Aggregate across all recorded votes
  const allVotes = voteHistory;
  const totalNorm = allVotes.filter((v) => v.vote === 'norm').length;
  const totalStrem = allVotes.filter((v) => v.vote === 'strem').length;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="inline-flex p-5 mb-5 rounded-3xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <Users className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Игра окончена!</h2>
          <p className="text-sm text-slate-400">Прошли {questionStates.length} вопросов</p>
        </div>

        {/* Final score */}
        <div className="flex items-stretch justify-center gap-3 mb-6">
          <div className="flex-1 max-w-[160px] rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Норм</span>
            </div>
            <p className="text-3xl font-black text-emerald-300 tabular-nums">{totalNorm}</p>
          </div>
          <div className="flex-1 max-w-[160px] rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
            <div className="flex items-center justify-center gap-1.5 text-red-400 mb-1">
              <ThumbsDown className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Стрем</span>
            </div>
            <p className="text-3xl font-black text-red-300 tabular-nums">{totalStrem}</p>
          </div>
        </div>

        {/* Questions list with expandable breakdown */}
        <div className="rounded-2xl border border-white/10 bg-[#13131a] p-4 mb-6 max-h-[45vh] overflow-y-auto scrollbar-thin space-y-2">
          {questionStates.map((qs, idx) => {
            const slotVotes = voteHistory.filter((v) => v.slot_index === idx);
            const slotNorm = slotVotes.filter((v) => v.vote === 'norm').length;
            const slotStrem = slotVotes.filter((v) => v.vote === 'strem').length;
            const isExpanded = expandedQuestion === idx;
            return (
              <div
                key={qs.id}
                className="rounded-xl border bg-white/[0.02] border-white/5"
              >
                <div className="flex items-start gap-3 p-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-sm text-slate-200 leading-relaxed pt-1">{qs.question_text}</p>
                  <div className="flex items-center gap-1 flex-shrink-0 pt-1">
                    {slotNorm > 0 && (
                      <span className="text-xs text-emerald-400 tabular-nums">{slotNorm}</span>
                    )}
                    {slotStrem > 0 && (
                      <span className="text-xs text-red-400 tabular-nums">{slotStrem}</span>
                    )}
                    <button
                      onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                      aria-label="Кто как проголосовал"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/5">
                    {slotVotes.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {slotVotes.map((v) => (
                          <div key={v.id} className="flex items-center gap-2 text-xs">
                            <span className="flex-1 text-slate-300">{v.player_name}</span>
                            {v.vote === 'norm' ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <ThumbsUp className="w-3 h-3" /> Норм
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400">
                                <ThumbsDown className="w-3 h-3" /> Стрем
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-2 mt-2">
                        Никто не проголосовал
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Players */}
        <div className="rounded-2xl border border-white/10 bg-[#13131a] p-4 mb-6">
          <p className="text-sm font-medium text-white mb-3">Игроки ({players.length})</p>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-xs text-slate-300">
                <span className="font-medium">{p.name}</span>
                {p.player_id === room.host_id && <span className="text-amber-400">★</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={playAgain}
              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Играть снова
            </button>
          ) : (
            <p className="text-center text-sm text-slate-500 py-2">Хост может начать новую игру</p>
          )}
          <button
            onClick={() => {
              leaveRoom();
              onExit();
            }}
            className="w-full px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            На главный экран
          </button>
        </div>
      </div>
    </div>
  );
}
