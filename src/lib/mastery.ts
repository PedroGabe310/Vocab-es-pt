export type MasteryStatus = "novo" | "aprendizado" | "dominada";

export const MASTERY_STREAK_THRESHOLD = 5;

export function classifyWord(progressRows: { correctStreak: number }[]): MasteryStatus {
  if (progressRows.length === 0) return "novo";
  return progressRows.some((r) => r.correctStreak >= MASTERY_STREAK_THRESHOLD)
    ? "dominada"
    : "aprendizado";
}
