function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
};

export function applySessionCompleted(state: StreakState, today = new Date()): StreakState {
  const todayStr = toDateOnly(today);

  if (state.lastSessionDate === todayStr) {
    return state;
  }

  const gap = state.lastSessionDate ? daysBetween(state.lastSessionDate, todayStr) : null;
  const currentStreak = gap === 1 ? state.currentStreak + 1 : 1;
  const longestStreak = Math.max(state.longestStreak, currentStreak);

  return { currentStreak, longestStreak, lastSessionDate: todayStr };
}
