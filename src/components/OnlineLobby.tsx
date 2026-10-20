import { useState } from 'react';
import { Wifi, Users, ArrowRight, Crown, Copy, Check, Plus, Minus, LogOut, Play } from 'lucide-react';
import type { useOnlineGame } from '@/hooks/useOnlineGame';

type OnlineHook = ReturnType<typeof useOnlineGame>;

interface OnlineLobbyProps {
  online: OnlineHook;
  onExit: () => void;
}

export function OnlineLobby({ online, onExit }: OnlineLobbyProps) {
  const [tab, setTab] = useState<'menu' | 'create' | 'join'>('menu');
  const [name, setName] = useState(online.name || '');
  const [code, setCode] = useState('');
  const [count, setCount] = useState(10);
  const [copied, setCopied] = useState(false);

  const { session, room, players, error, loading, createRoom, joinRoom, leaveRoom, startGame, updateTimer } = online;

  const isHost = session?.isHost ?? false;

  const handleCopy = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  // In-room lobby view (after creating/joining)
  if (session && room) {
    const allReady = players.length > 0 && players.every((p) => p.ready);
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-6">
            <div className="inline-flex p-4 mb-4 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Users className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Комната создана</h2>
            <p className="text-sm text-slate-400">Поделитесь кодом с друзьями</p>
          </div>

          {/* Room code */}
          <div className="rounded-2xl border border-white/10 bg-[#13131a] p-5 mb-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Код комнаты</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-black tracking-[0.3em] text-emerald-400">{room.code}</span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-2xl border border-white/10 bg-[#13131a] p-5 mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Количество вопросов</p>
                <p className="text-xs text-slate-400 mt-0.5">Всего в игре</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => isHost && setCount((c) => Math.max(5, c - 5))}
                  disabled={!isHost}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white flex items-center justify-center transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-bold text-white tabular-nums w-8 text-center">{count}</span>
                <button
                  onClick={() => isHost && setCount((c) => Math.min(100, c + 5))}
                  disabled={!isHost}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white flex items-center justify-center transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Таймер готовности</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {room.timer_enabled
                      ? `Отсчёт ${room.timer_seconds}с после готовности всех`
                      : 'Раунд идёт сразу, когда все готовы'}
                  </p>
                </div>
                <button
                  onClick={() => isHost && updateTimer(!room.timer_enabled, room.timer_seconds)}
                  disabled={!isHost}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-30 ${
                    room.timer_enabled ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      room.timer_enabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
              {room.timer_enabled && (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Длительность таймера</span>
                    <span className="text-xs text-slate-500 tabular-nums">{room.timer_seconds}с</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={5}
                    value={room.timer_seconds}
                    disabled={!isHost}
                    onChange={(e) => isHost && updateTimer(true, Number(e.target.value))}
                    className="w-full mt-2 accent-emerald-500 disabled:opacity-30"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Players list */}
          <div className="rounded-2xl border border-white/10 bg-[#13131a] p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white">Игроки</p>
              <span className="text-xs text-slate-500 tabular-nums">{players.length}</span>
            </div>
            <div className="space-y-2">
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03]">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/30 to-emerald-600/20 flex items-center justify-center text-xs font-bold text-white">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm text-slate-200 truncate">{p.name}</span>
                  {p.player_id === room.host_id && (
                    <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  {p.ready && (
                    <span className="text-xs text-emerald-400 font-medium flex-shrink-0">Готов</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {isHost ? (
              <button
                onClick={startGame}
                disabled={players.length < 1}
                className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white font-bold shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Начать игру
              </button>
            ) : (
              <div className="w-full px-6 py-4 rounded-2xl bg-white/5 text-slate-400 text-sm text-center">
                Ожидание начала игры от хоста...
              </div>
            )}
            <button
              onClick={leaveRoom}
              className="w-full px-6 py-3 rounded-2xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-medium transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Выйти из комнаты
            </button>
            <button
              onClick={() => {
                leaveRoom();
                setTab('menu');
                onExit();
              }}
              className="w-full text-sm text-slate-600 hover:text-slate-400 transition-colors"
            >
              На главный экран
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Menu view (choose create or join)
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex p-5 mb-5 rounded-3xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <Wifi className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Онлайн игра</h2>
          <p className="text-sm text-slate-400">Создайте комнату или присоединитесь к друзьям</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {tab === 'menu' && (
          <div className="space-y-3">
            <button
              onClick={() => setTab('create')}
              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Создать комнату
            </button>
            <button
              onClick={() => setTab('join')}
              className="w-full px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              Присоединиться по коду
            </button>
            <button
              onClick={onExit}
              className="w-full text-sm text-slate-600 hover:text-slate-400 transition-colors"
            >
              ← Назад
            </button>
          </div>
        )}

        {tab === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Ваше имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Введите имя"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Количество вопросов</label>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => setCount((c) => Math.max(5, c - 5))}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-bold text-white tabular-nums">{count}</span>
                <button
                  onClick={() => setCount((c) => Math.min(100, c + 5))}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Шаг по 5, от 5 до 100</p>
            </div>
            <button
              onClick={() => createRoom(name, count)}
              disabled={loading || !name.trim()}
              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white font-bold shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Создать
            </button>
            <button
              onClick={() => setTab('menu')}
              className="w-full text-sm text-slate-600 hover:text-slate-400 transition-colors"
            >
              ← Назад
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Код комнаты</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABCDEF"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-2xl font-bold tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Ваше имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Введите имя"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => joinRoom(code, name)}
              disabled={loading || !name.trim() || code.length < 6}
              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-40 text-white font-bold shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              Присоединиться
            </button>
            <button
              onClick={() => setTab('menu')}
              className="w-full text-sm text-slate-600 hover:text-slate-400 transition-colors"
            >
              ← Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
