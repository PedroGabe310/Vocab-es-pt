export type SrsState = {
  intervalDays: number;
  easeFactor: number;
  correctStreak: number;
};

const MIN_EASE_FACTOR = 1.3;

export function applySm2(state: SrsState, correct: boolean): SrsState {
  if (!correct) {
    return {
      intervalDays: 1,
      easeFactor: Math.max(MIN_EASE_FACTOR, state.easeFactor - 0.2),
      correctStreak: 0,
    };
  }

  const correctStreak = state.correctStreak + 1;
  const easeFactor = Math.max(MIN_EASE_FACTOR, state.easeFactor + 0.1);

  let intervalDays: number;
  if (correctStreak === 1) intervalDays = 1;
  else if (correctStreak === 2) intervalDays = 6;
  else intervalDays = Math.round(state.intervalDays * easeFactor);

  return { intervalDays, easeFactor, correctStreak };
}

export function nextReviewDate(intervalDays: number, from = new Date()): Date {
  const date = new Date(from);
  date.setDate(date.getDate() + intervalDays);
  return date;
}
