import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userProgress, type Direction } from "@/db/schema";
import { applySm2, nextReviewDate } from "@/lib/srs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    wordId: number;
    direction: Direction;
    correct: boolean;
  };

  const { wordId, direction, correct } = body;
  if (!wordId || !direction) {
    return NextResponse.json({ error: "wordId e direction são obrigatórios" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.wordId, wordId), eq(userProgress.direction, direction)));

  const current = existing ?? {
    intervalDays: 0,
    easeFactor: 2.5,
    correctStreak: 0,
    totalReviews: 0,
  };

  const next = applySm2(current, correct);
  const nextReviewAt = nextReviewDate(next.intervalDays);

  if (existing) {
    await db
      .update(userProgress)
      .set({
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        correctStreak: next.correctStreak,
        nextReviewAt,
        totalReviews: current.totalReviews + 1,
        lastResult: correct,
      })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({
      wordId,
      direction,
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      correctStreak: next.correctStreak,
      nextReviewAt,
      totalReviews: 1,
      lastResult: correct,
    });
  }

  return NextResponse.json({ ok: true, nextReviewAt });
}
