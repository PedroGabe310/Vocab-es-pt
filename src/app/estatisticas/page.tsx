import { eq } from "drizzle-orm";
import { db } from "@/db";
import { words, userProgress, sessions, reviewLog } from "@/db/schema";
import { classifyWord, type MasteryStatus } from "@/lib/mastery";
import { levelFromXp } from "@/lib/xp";

const STATUS_META: Record<MasteryStatus, { label: string; bgClass: string }> = {
  novo: { label: "Novas", bgClass: "bg-[#2a78d6] dark:bg-[#3987e5]" },
  aprendizado: { label: "Em aprendizado", bgClass: "bg-[#eb6834] dark:bg-[#d95926]" },
  dominada: { label: "Dominadas", bgClass: "bg-[#1baf7a] dark:bg-[#199e70]" },
};

export default async function EstatisticasPage() {
  const [allWords, progressRows, allSessions, logs] = await Promise.all([
    db.select().from(words),
    db.select({ wordId: userProgress.wordId, correctStreak: userProgress.correctStreak }).from(userProgress),
    db.select({ xpEarned: sessions.xpEarned }).from(sessions),
    db
      .select({
        wordId: reviewLog.wordId,
        correct: reviewLog.correct,
        wordEs: words.wordEs,
        wordPt: words.wordPt,
      })
      .from(reviewLog)
      .innerJoin(words, eq(reviewLog.wordId, words.id)),
  ]);

  const progressByWord = new Map<number, { correctStreak: number }[]>();
  for (const row of progressRows) {
    const list = progressByWord.get(row.wordId) ?? [];
    list.push({ correctStreak: row.correctStreak });
    progressByWord.set(row.wordId, list);
  }

  const counts: Record<MasteryStatus, number> = { novo: 0, aprendizado: 0, dominada: 0 };
  for (const w of allWords) {
    const status = classifyWord(progressByWord.get(w.id) ?? []);
    counts[status]++;
  }
  const total = allWords.length || 1;

  const totalXp = allSessions.reduce((sum, s) => sum + s.xpEarned, 0);
  const { level, xpIntoLevel, xpPerLevel } = levelFromXp(totalXp);

  const totalAnswers = logs.length;
  const correctAnswers = logs.filter((l) => l.correct).length;
  const retention = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : null;

  const mistakeMap = new Map<number, { wordEs: string; wordPt: string; wrong: number; total: number }>();
  for (const log of logs) {
    const entry = mistakeMap.get(log.wordId) ?? {
      wordEs: log.wordEs,
      wordPt: log.wordPt,
      wrong: 0,
      total: 0,
    };
    entry.total++;
    if (!log.correct) entry.wrong++;
    mistakeMap.set(log.wordId, entry);
  }
  const mostMistaken = [...mistakeMap.values()]
    .filter((e) => e.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 5);

  const order: MasteryStatus[] = ["novo", "aprendizado", "dominada"];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-10">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Estatísticas</h1>

      <section className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-5 dark:border-white/[.145]">
        <h2 className="font-medium text-black dark:text-zinc-50">Nível {level}</h2>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/[.08] dark:bg-white/[.145]">
          <div
            className="h-full rounded-full bg-[#2a78d6] dark:bg-[#3987e5]"
            style={{ width: `${(xpIntoLevel / xpPerLevel) * 100}%` }}
          />
        </div>
        <p className="text-sm text-zinc-500">
          {xpIntoLevel} / {xpPerLevel} XP para o próximo nível · {totalXp} XP total
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-black/[.08] p-5 dark:border-white/[.145]">
        <h2 className="font-medium text-black dark:text-zinc-50">Progresso do vocabulário</h2>

        <div className="flex h-6 w-full overflow-hidden rounded-full">
          {order.map((status, i) => {
            const count = counts[status];
            if (count === 0) return null;
            const widthPct = (count / total) * 100;
            return (
              <div
                key={status}
                style={{ width: `${widthPct}%` }}
                className={`h-full ${STATUS_META[status].bgClass} ${i > 0 ? "ml-[2px]" : ""}`}
              />
            );
          })}
        </div>

        <ul className="flex flex-col gap-1.5 text-sm">
          {order.map((status) => (
            <li key={status} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_META[status].bgClass}`} />
              <span className="text-zinc-600 dark:text-zinc-400">{STATUS_META[status].label}</span>
              <span className="ml-auto font-medium text-black dark:text-zinc-50">
                {counts[status]} ({Math.round((counts[status] / total) * 100)}%)
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-black/[.08] p-5 dark:border-white/[.145]">
        <h2 className="font-medium text-black dark:text-zinc-50">Retenção</h2>
        {retention === null ? (
          <p className="text-sm text-zinc-500">Ainda sem respostas registradas.</p>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {retention}% de acertos em {totalAnswers} resposta(s)
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-5 dark:border-white/[.145]">
        <h2 className="font-medium text-black dark:text-zinc-50">Palavras mais erradas</h2>
        {mostMistaken.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum erro registrado ainda.</p>
        ) : (
          <div className="flex flex-col divide-y divide-black/[.08] dark:divide-white/[.145]">
            {mostMistaken.map((m) => (
              <div key={m.wordEs} className="flex items-center justify-between py-2 text-sm">
                <span className="text-black dark:text-zinc-50">
                  {m.wordEs} → {m.wordPt}
                </span>
                <span className="text-zinc-500">
                  {m.wrong} erro(s) / {m.total} tentativa(s)
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
