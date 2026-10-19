import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_QUESTIONS, type Question } from '@/data/questions';

const QUESTIONS_KEY = 'norm-strem-questions';

function loadQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_QUESTIONS;
}

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>(loadQuestions);

  useEffect(() => {
    try {
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
    } catch {
      // ignore
    }
  }, [questions]);

  const addQuestion = useCallback((text: string) => {
    setQuestions((prev) => {
      const maxId = prev.reduce((m, q) => Math.max(m, q.id), 0);
      return [...prev, { id: maxId + 1, text: text.trim() }];
    });
  }, []);

  const updateQuestion = useCallback((id: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, text: text.trim() } : q))
    );
  }, []);

  const deleteQuestion = useCallback((id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const resetToDefault = useCallback(() => {
    setQuestions(DEFAULT_QUESTIONS);
  }, []);

  return { questions, addQuestion, updateQuestion, deleteQuestion, resetToDefault };
}
