import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, streak } from "@/db/schema";
import { applySessionCompleted } from "@/lib/streak";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    wordsReviewed: number;
    wordsCorrect: number;
    xpEarned: number;
  };

  const { wordsReviewed, wordsCorrect, xpEarned } = body;

  await db.insert(sessions).values({ wordsReviewed, wordsCorrect, xpEarned });

  const [existing] = await db.select().from(streak);

  const current = existing ?? {
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: null,
  };

  const next = applySessionCompleted(current);

  if (existing) {
    await db
      .update(streak)
      .set({
        currentStreak: next.currentStreak,
        longestStreak: next.longestStreak,
        lastSessionDate: next.lastSessionDate,
      })
      .where(eq(streak.id, existing.id));
  } else {
    await db.insert(streak).values({
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      lastSessionDate: next.lastSessionDate,
    });
  }

  return NextResponse.json({
    currentStreak: next.currentStreak,
    longestStreak: next.longestStreak,
  });
}
