const XP_PER_LEVEL = 100;

export function levelFromXp(totalXp: number) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  return { level, xpIntoLevel, xpPerLevel: XP_PER_LEVEL };
}
