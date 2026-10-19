import { useMemo, useState } from 'react';
import {
  Shuffle,
  SkipForward,
  Home,
  Settings as SettingsIcon,
  Layers,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  X,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import type { Question } from '@/data/questions';
import type { Vote } from '@/hooks/useGame';

interface GameScreenProps {
  question: Question;
  questionNumber: number;
  totalInDeck: number;
  totalShown: number;
  roundComplete: boolean;
  animKey: number;
  votes: Record<number, Vote>;
  questions: Question[];
  onNext: () => void;
  onRandom: () => void;
  onSkip: () => void;
  onVote: (vote: Vote) => void;
  onHome: () => void;
  onOpenSettings: () => void;
  onOpenList: () => void;
  onRestart: () => void;
  onEndRound: () => void;
}

export function GameScreen({
  question,
  questionNumber,
  totalInDeck,
  totalShown,
  roundComplete,
  animKey,
  votes,
  questions,
  onNext,
  onRandom,
  onSkip,
  onVote,
  onHome,
  onOpenSettings,
  onOpenList,
  onRestart,
  onEndRound,
}: GameScreenProps) {
  const [copied, setCopied] = useState(false);

  const progress = useMemo(() => {
    if (totalInDeck === 0) return 0;
    return Math.round((questionNumber / totalInDeck) * 100);
  }, [questionNumber, totalInDeck]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(question.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  if (roundComplete) {
    const normCount = Object.values(votes).filter((v) => v === 'norm').length;
    const stremCount = Object.values(votes).filter((v) => v === 'strem').length;
    const skipped = totalInDeck - normCount - stremCount;

    const answered = Object.entries(votes)
      .map(([idStr, vote]) => {
        const q = questions.find((x) => x.id === Number(idStr));
        return q ? { id: q.id, text: q.text, vote } : null;
      })
      .filter((x): x is { id: number; text: string; vote: Vote } => x !== null);

    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-5 mb-5 rounded-3xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Sparkles className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3">Раунд пройден!</h2>

            {/* Score */}
            <div className="flex items-stretch justify-center gap-3 mb-2">
              <div className="flex-1 max-w-[160px] rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Норм</span>
                </div>
                <p className="text-3xl font-black text-emerald-300 tabular-nums">{normCount}</p>
              </div>
              <div className="flex-1 max-w-[160px] rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
                <div className="flex items-center justify-center gap-1.5 text-red-400 mb-1">
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Стрем</span>
                </div>
                <p className="text-3xl font-black text-red-300 tabular-nums">{stremCount}</p>
              </div>
            </div>
            {skipped > 0 && (
              <p className="text-xs text-slate-500">Пропущено: {skipped}</p>
            )}
          </div>

          {/* Results list */}
          <div className="rounded-2xl border border-white/10 bg-[#13131a] p-4 mb-6 max-h-[40vh] overflow-y-auto scrollbar-thin">
            {answered.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">
                Вы не проголосовали ни по одному вопросу
              </p>
            ) : (
              <div className="space-y-2">
                {answered.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      item.vote === 'norm'
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${
                        item.vote === 'norm'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {item.vote === 'norm' ? (
                        <ThumbsUp className="w-4 h-4" />
                      ) : (
                        <ThumbsDown className="w-4 h-4" />
                      )}
                    </div>
                    <p className="flex-1 text-sm text-slate-200 leading-relaxed pt-1">
                      {item.text}
                    </p>
                    <span
                      className={`flex-shrink-0 text-xs font-bold uppercase tracking-wider pt-1.5 ${
                        item.vote === 'norm' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {item.vote === 'norm' ? 'Норм' : 'Стрем'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onRestart}
              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Новый раунд
            </button>
            <button
              onClick={onHome}
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

  return (
    <div className="min-h-[100dvh] flex flex-col px-4 py-5 sm:py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 max-w-2xl w-full mx-auto mb-6">
        <button
          onClick={onHome}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          aria-label="На главный экран"
        >
          <Home className="w-5 h-5" />
        </button>

        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-medium tabular-nums">
              {questionNumber} из {totalInDeck}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenList}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            aria-label="Список вопросов"
          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            aria-label="Настройки"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl perspective">
          <div key={animKey} className="relative animate-card-flip">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-purple-600/20 to-emerald-600/20 blur-xl opacity-60" />

            <div className="relative rounded-3xl border border-white/10 bg-[#15151f] p-6 sm:p-10 md:p-12 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Вопрос
                </span>
                <button
                  onClick={onSkip}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
                  aria-label="Пропустить"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-emerald-600/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-sm text-slate-400">Вопрос {questionNumber}</span>
              </div>

              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug text-balance mb-8">
                {question.text}
              </p>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm font-medium transition-all mb-4"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Скопировать вопрос
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vote buttons */}
      <div className="max-w-2xl w-full mx-auto mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onVote('norm')}
            className="px-5 py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-[0_0_25px_-8px_rgba(16,185,129,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-1.5"
          >
            <ThumbsUp className="w-6 h-6" />
            <span>Норм</span>
          </button>
          <button
            onClick={() => onVote('strem')}
            className="px-5 py-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold shadow-[0_0_25px_-8px_rgba(239,68,68,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-1.5"
          >
            <ThumbsDown className="w-6 h-6" />
            <span>Стрем</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <button
            onClick={onSkip}
            className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <SkipForward className="w-4 h-4" />
            Пропустить
          </button>
          <button
            onClick={onRandom}
            className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <Shuffle className="w-4 h-4" />
            Случайный
          </button>
          <button
            onClick={onEndRound}
            className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-sm font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Закончить
          </button>
        </div>

        <p className="text-xs text-slate-600 text-center tabular-nums">
          Просмотрено: {totalShown}
        </p>
      </div>
    </div>
  );
}
