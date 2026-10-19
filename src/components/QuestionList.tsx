import { useState } from 'react';
import { Sparkles, Layers, Search, X, Copy, Check, Pencil, Trash2, Plus, RotateCcw } from 'lucide-react';
import type { Question } from '@/data/questions';

interface QuestionListProps {
  onClose: () => void;
  questions: Question[];
  onAdd: (text: string) => void;
  onUpdate: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onReset: () => void;
}

export function QuestionList({ onClose, questions, onAdd, onUpdate, onDelete, onReset }: QuestionListProps) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const filtered = questions.filter((q) => {
    if (search.trim()) {
      return q.text.toLowerCase().includes(search.trim().toLowerCase());
    }
    return true;
  });

  const handleCopy = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditText(q.text);
  };

  const saveEdit = () => {
    if (editingId !== null && editText.trim()) {
      onUpdate(editingId, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveNew = () => {
    if (newText.trim()) {
      onAdd(newText);
      setNewText('');
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#13131a] shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Вопросы</h2>
            <span className="text-sm text-slate-400">({questions.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск вопроса..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
          {/* Add new question */}
          {adding ? (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
              <textarea
                autoFocus
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Введите текст нового вопроса..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={saveNew}
                  disabled={!newText.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Добавить
                </button>
                <button
                  onClick={() => { setAdding(false); setNewText(''); }}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-purple-500/10 border border-dashed border-white/10 hover:border-purple-500/30 text-slate-400 hover:text-purple-300 text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Добавить вопрос
            </button>
          )}

          {filtered.length === 0 && !adding ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Sparkles className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Ничего не найдено</p>
            </div>
          ) : (
            filtered.map((q, idx) => (
              <div
                key={q.id}
                className="group flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {editingId === q.id ? (
                    <div className="space-y-2">
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={!editText.trim()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-medium transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Сохранить
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-200 leading-relaxed">{q.text}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          onClick={() => startEdit(q)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-purple-300 hover:bg-purple-500/10 text-xs font-medium transition-all"
                        >
                          <Pencil className="w-3 h-3" />
                          Изменить
                        </button>
                        <button
                          onClick={() => onDelete(q.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          Удалить
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {editingId !== q.id && (
                  <button
                    onClick={() => handleCopy(q.text, q.id)}
                    className="flex-shrink-0 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Скопировать"
                  >
                    {copiedId === q.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer with reset */}
        <div className="p-4 border-t border-white/10">
          {confirmReset ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">Сбросить все вопросы к изначальным?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { onReset(); setConfirmReset(false); }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all"
                >
                  Да, сбросить
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 text-sm font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Сбросить к стандартным вопросам
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
