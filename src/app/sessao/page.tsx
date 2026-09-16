"use client";

import { useEffect, useState } from "react";
import type { SessionItem } from "@/lib/session-types";

type Phase = "loading" | "empty" | "playing" | "summary";

type Feedback = { correct: boolean; correctAnswer: string } | null;

export default function SessaoPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<SessionItem[]>([]);
  const [index, setIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [reviewed, setReviewed] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streakInfo, setStreakInfo] = useState<{ currentStreak: number; longestStreak: number } | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/session/start")
      .then((r) => r.json())
      .then((data: { items: SessionItem[] }) => {
        setItems(data.items);
        setPhase(data.items.length === 0 ? "empty" : "playing");
      });
  }, []);

  const current = items[index];

  async function submitAnswer(correct: boolean) {
    if (!current || feedback) return;

    setFeedback({ correct, correctAnswer: current.correctAnswer });
    setReviewed((n) => n + 1);
    if (correct) setCorrectCount((n) => n + 1);

    await fetch("/api/session/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: current.wordId, direction: current.direction, correct }),
    });
  }

  function handleTypingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || feedback) return;
    const correct = typedAnswer.trim().toLowerCase() === current.correctAnswer.trim().toLowerCase();
    submitAnswer(correct);
  }

  async function goNext() {
    setFeedback(null);
    setTypedAnswer("");

    if (index + 1 < items.length) {
      setIndex((i) => i + 1);
      return;
    }

    const xpEarned = correctCount * 10;
    const res = await fetch("/api/session/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordsReviewed: reviewed, wordsCorrect: correctCount, xpEarned }),
    });
    const summary = await res.json();
    setStreakInfo(summary);
    setPhase("summary");
  }

  if (phase === "loading") {
    return <Centered>Carregando sessão...</Centered>;
  }

  if (phase === "empty") {
    return (
      <Centered>
        <p className="text-lg text-black dark:text-zinc-50">
          Nenhuma palavra pendente por enquanto. 🎉
        </p>
        <a href="/palavras" className="text-sm text-zinc-500 underline">
          Cadastrar novas palavras
        </a>
      </Centered>
    );
  }

  if (phase === "summary") {
    const xpEarned = correctCount * 10;
    return (
      <Centered>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Sessão concluída!</h1>
        <div className="flex flex-col gap-1 text-center text-zinc-600 dark:text-zinc-400">
          <p>
            {correctCount} de {reviewed} corretas
          </p>
          <p>+{xpEarned} XP</p>
          {streakInfo && (
            <p>
              🔥 Streak atual: {streakInfo.currentStreak} dia(s) (recorde: {streakInfo.longestStreak})
            </p>
          )}
        </div>
        <a
          href="/"
          className="mt-2 rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Voltar ao início
        </a>
      </Centered>
    );
  }

  if (!current) return null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center text-sm text-zinc-500">
        {index + 1} / {items.length}
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          {current.direction === "es_to_pt" ? "Espanhol → Português" : "Português → Espanhol"}
        </span>
        <span className="text-3xl font-semibold text-black dark:text-zinc-50">
          {current.prompt}
        </span>
      </div>

      {current.kind === "multiple_choice" && current.choices ? (
        <div className="flex flex-col gap-2">
          {current.choices.map((choice) => {
            const isCorrectChoice = choice === current.correctAnswer;
            const showState = feedback
              ? isCorrectChoice
                ? "correct"
                : "neutral"
              : "idle";

            return (
              <button
                key={choice}
                disabled={!!feedback}
                onClick={() => submitAnswer(isCorrectChoice)}
                className={`rounded border px-4 py-3 text-left text-sm transition-colors ${
                  showState === "correct"
                    ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                    : "border-black/[.15] hover:bg-black/[.04] dark:border-white/[.2] dark:hover:bg-white/[.06]"
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleTypingSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            disabled={!!feedback}
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            placeholder="Digite a tradução"
            className="rounded border border-black/[.15] bg-transparent px-3 py-2 text-center text-lg dark:border-white/[.2]"
          />
          {!feedback && (
            <button
              type="submit"
              className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Responder
            </button>
          )}
        </form>
      )}

      {feedback && (
        <div className="flex flex-col items-center gap-3 rounded border border-black/[.08] p-4 dark:border-white/[.145]">
          <p
            className={
              feedback.correct
                ? "font-medium text-green-600 dark:text-green-400"
                : "font-medium text-red-600 dark:text-red-400"
            }
          >
            {feedback.correct ? "Correto!" : `Errado. Resposta: ${feedback.correctAnswer}`}
          </p>
          {current.isFalseCognate && current.falseMeaningNote && (
            <p className="text-center text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Falso cognato: {current.falseMeaningNote}
            </p>
          )}
          <button
            onClick={goNext}
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {index + 1 < items.length ? "Próxima" : "Ver resumo"}
          </button>
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      {children}
    </div>
  );
}
