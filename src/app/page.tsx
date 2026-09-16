import { lte, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { userProgress, words, streak } from "@/db/schema";

export default async function Home() {
  const now = new Date();

  const [dueRows, allWords, seenRows, [streakRow]] = await Promise.all([
    db.select().from(userProgress).where(lte(userProgress.nextReviewAt, now)),
    db.select().from(words),
    db.selectDistinct({ wordId: userProgress.wordId }).from(userProgress),
    db.select().from(streak),
  ]);

  const seenIds = seenRows.map((r) => r.wordId);
  const newWordsCount = seenIds.length
    ? (await db.select().from(words).where(notInArray(words.id, seenIds))).length
    : allWords.length;

  const pendingCount = dueRows.length + Math.min(newWordsCount, 20 - dueRows.length);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Vocab Trainer ES ↔ PT
      </h1>

      <div className="flex flex-col gap-1">
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
      </div>

      <a
        href="/sessao"
        className="rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Iniciar sessão
      </a>

      <a href="/palavras" className="text-sm text-zinc-500 underline">
        Gerenciar palavras
      </a>
    </div>
  );
}
