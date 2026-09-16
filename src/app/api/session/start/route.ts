import { NextResponse } from "next/server";
import { asc, lte, eq } from "drizzle-orm";
import { db } from "@/db";
import { userProgress, words, type Direction } from "@/db/schema";
import type { SessionItem } from "@/lib/session-types";

const DUE_LIMIT = 15;
const SESSION_SIZE = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET() {
  const now = new Date();

  const dueRows = await db
    .select({
      wordId: userProgress.wordId,
      direction: userProgress.direction,
      correctStreak: userProgress.correctStreak,
      wordEs: words.wordEs,
      wordPt: words.wordPt,
      isFalseCognate: words.isFalseCognate,
      falseMeaningNote: words.falseMeaningNote,
    })
    .from(userProgress)
    .innerJoin(words, eq(userProgress.wordId, words.id))
    .where(lte(userProgress.nextReviewAt, now))
    .orderBy(asc(userProgress.nextReviewAt))
    .limit(DUE_LIMIT);

  const allWords = await db.select().from(words);
  const seenRows = await db
    .selectDistinct({ wordId: userProgress.wordId })
    .from(userProgress);
  const seenIds = new Set(seenRows.map((r) => r.wordId));

  const newWords = shuffle(allWords.filter((w) => !seenIds.has(w.id))).slice(
    0,
    Math.max(0, SESSION_SIZE - dueRows.length),
  );

  function buildChoices(direction: Direction, wordId: number, correctAnswer: string) {
    const pool = allWords.filter((w) => w.id !== wordId);
    const distractors = shuffle(pool)
      .slice(0, 3)
      .map((w) => (direction === "es_to_pt" ? w.wordPt : w.wordEs));
    return shuffle([correctAnswer, ...distractors]);
  }

  function toItem(
    wordId: number,
    direction: Direction,
    correctStreak: number,
    wordEs: string,
    wordPt: string,
    isFalseCognate: boolean,
    falseMeaningNote: string | null,
  ): SessionItem {
    const prompt = direction === "es_to_pt" ? wordEs : wordPt;
    const correctAnswer = direction === "es_to_pt" ? wordPt : wordEs;
    const kind = correctStreak >= 2 && Math.random() < 0.5 ? "typing" : "multiple_choice";

    return {
      wordId,
      direction,
      kind,
      prompt,
      correctAnswer,
      choices: kind === "multiple_choice" ? buildChoices(direction, wordId, correctAnswer) : undefined,
      isFalseCognate,
      falseMeaningNote,
    };
  }

  const dueItems = dueRows.map((r) =>
    toItem(r.wordId, r.direction, r.correctStreak, r.wordEs, r.wordPt, r.isFalseCognate, r.falseMeaningNote),
  );

  const newItems = newWords.map((w, i) =>
    toItem(
      w.id,
      i % 2 === 0 ? "es_to_pt" : "pt_to_es",
      0,
      w.wordEs,
      w.wordPt,
      w.isFalseCognate,
      w.falseMeaningNote,
    ),
  );

  const items = shuffle([...dueItems, ...newItems]);

  return NextResponse.json({ items, dueCount: dueRows.length, newCount: newItems.length });
}
