import { lte, notInArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { userProgress, words, streak, sessions } from "@/db/schema";
import { levelFromXp } from "@/lib/xp";

export default async function Home() {
  const now = new Date();

  const [dueRows, allWords, seenRows, [streakRow], allSessions, categoryRows] = await Promise.all([
    db.select().from(userProgress).where(lte(userProgress.nextReviewAt, now)),
    db.select().from(words),
    db.selectDistinct({ wordId: userProgress.wordId }).from(userProgress),
    db.select().from(streak),
    db.select({ xpEarned: sessions.xpEarned }).from(sessions),
    db.selectDistinct({ category: words.category }).from(words).where(isNotNull(words.category)),
  ]);

  const seenIds = seenRows.map((r) => r.wordId);
  const newWordsCount = seenIds.length
    ? (await db.select().from(words).where(notInArray(words.id, seenIds))).length
    : allWords.length;

  const pendingCount = dueRows.length + Math.min(newWordsCount, 20 - dueRows.length);

  const totalXp = allSessions.reduce((sum, s) => sum + s.xpEarned, 0);
  const { level, xpIntoLevel, xpPerLevel } = levelFromXp(totalXp);
  const categories = categoryRows.map((c) => c.category).filter((c): c is string => !!c);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Vocab Trainer ES ↔ PT
      </h1>

      <div className="flex w-full flex-col gap-1">
        <p className="text-zinc-600 dark:text-zinc-400">
          {pendingCount > 0
            ? `${pendingCount} palavra(s) pendente(s) hoje`
            : "Tudo em dia por aqui!"}
        </p>
        {streakRow && (
          <p className="text-sm text-zinc-500">
            🔥 {streakRow.currentStreak} dia(s) de streak (recorde: {streakRow.longestStreak})
          </p>
        )}
        <p className="text-xs text-zinc-500">{allWords.length} palavra(s) cadastrada(s) no total</p>

        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Nível {level}</span>
            <span>
              {xpIntoLevel}/{xpPerLevel} XP
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[.08] dark:bg-white/[.145]">
            <div
              className="h-full rounded-full bg-[#2a78d6] dark:bg-[#3987e5]"
              style={{ width: `${(xpIntoLevel / xpPerLevel) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <a
        href="/sessao"
        className="rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Iniciar sessão
      </a>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => (
            <a
              key={c}
              href={`/sessao?category=${encodeURIComponent(c)}`}
              className="rounded-full border border-black/[.15] px-3 py-1 text-xs text-zinc-600 hover:bg-black/[.04] dark:border-white/[.2] dark:text-zinc-400 dark:hover:bg-white/[.06]"
            >
              Só {c}
            </a>
          ))}
        </div>
      )}

      <div className="flex gap-4 text-sm text-zinc-500">
        <a href="/palavras" className="underline">
          Gerenciar palavras
        </a>
        <a href="/estatisticas" className="underline">
          Estatísticas
        </a>
      </div>
    </div>
  );
}
