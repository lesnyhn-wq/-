import { useState } from 'react';
import { Settings, Shuffle, RotateCcw, Repeat, X } from 'lucide-react';
import type { GameSettings } from '@/hooks/useGame';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdate: (partial: Partial<GameSettings>) => void;
  onShuffle: () => void;
  onRestart: () => void;
}

export function SettingsPanel({
  open,
  onClose,
  settings,
  onUpdate,
  onShuffle,
  onRestart,
}: SettingsPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#13131a] shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Настройки</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* No-repeat toggle */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Repeat className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Не повторять вопросы</p>
                  <p className="text-xs text-slate-400 mt-0.5">В течение одного раунда</p>
                </div>
              </div>
              <button
                onClick={() => onUpdate({ noRepeatInRound: !settings.noRepeatInRound })}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  settings.noRepeatInRound ? 'bg-purple-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={settings.noRepeatInRound}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.noRepeatInRound ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <button
              onClick={() => {
                onShuffle();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium transition-all"
            >
              <Shuffle className="w-4 h-4 text-emerald-400" />
              Перемешать колоду
            </button>
            <button
              onClick={() => {
                onRestart();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Начать заново
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
