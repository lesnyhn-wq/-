import { useState, useEffect } from 'react';
import {
  Play,
  Layers,
  Settings as SettingsIcon,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Wifi,
} from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  onContinue: () => void;
  onOpenList: () => void;
  onOpenSettings: () => void;
  onOpenOnline: () => void;
  totalQuestions: number;
  hasSavedRound: boolean;
  savedProgress: number;
  savedDeckLength: number;
}

export function StartScreen({
  onStart,
  onContinue,
  onOpenList,
  onOpenSettings,
  onOpenOnline,
  totalQuestions,
  hasSavedRound,
  savedProgress,
  savedDeckLength,
}: StartScreenProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const progressPercent = savedDeckLength > 0 ? Math.round((savedProgress / savedDeckLength) * 100) : 0;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10">
      {/* Decorative glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] animate-glow" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-600/10 rounded-full blur-[100px] animate-glow" style={{ animationDelay: '2s' }} />
      </div>

      <div className={`relative z-10 w-full max-w-lg text-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Игра для компании
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4 title-gradient leading-[1.05]">
          НОРМ
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>ИЛИ
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>СТРЕМ?
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 mb-2 max-w-md mx-auto leading-relaxed">
          Вытягивайте вопросы и узнавайте друг друга получше
        </p>

        {/* Question count */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-xl bg-white/5 border border-white/10">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-slate-300">
            <span className="font-bold text-white">{totalQuestions}</span> вопросов в колоде
          </span>
        </div>

        {/* Main CTA */}
        <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
          {hasSavedRound && (
            <div className="w-full space-y-3">
              <button
                onClick={onContinue}
                className="group relative w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Продолжить игру
                </span>
              </button>
              <div className="px-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Прогресс прошлой игры</span>
                  <span className="text-xs text-slate-500 tabular-nums">{progressPercent}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-purple-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onStart}
            className={`group relative w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-lg shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${hasSavedRound ? '' : 'sm:w-auto'}`}
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              {hasSavedRound ? 'Новая игра' : 'Начать игру'}
            </span>
          </button>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onOpenList}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              Вопросы
            </button>
            <button
              onClick={onOpenSettings}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              Настройки
            </button>
          </div>

          <button
            onClick={onOpenOnline}
            className="mt-3 px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Wifi className="w-4 h-4" />
            Онлайн игра с друзьями
          </button>
        </div>

        {/* Hint */}
        <p className="mt-8 text-xs text-slate-600 flex items-center justify-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          Прогресс сохраняется автоматически
        </p>
      </div>
    </div>
  );
}
