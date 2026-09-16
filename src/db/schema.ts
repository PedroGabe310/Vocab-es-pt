import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  real,
  timestamp,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";

export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  wordEs: text("word_es").notNull(),
  wordPt: text("word_pt").notNull(),
  category: text("category"),
  isFalseCognate: boolean("is_false_cognate").notNull().default(false),
  falseMeaningNote: text("false_meaning_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const deckWords = pgTable(
  "deck_words",
  {
    deckId: integer("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.deckId, table.wordId] })],
);

export const directionEnum = ["es_to_pt", "pt_to_es"] as const;
export type Direction = (typeof directionEnum)[number];

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id, { onDelete: "cascade" }),
  direction: text("direction", { enum: directionEnum }).notNull(),
  intervalDays: real("interval_days").notNull().default(0),
  easeFactor: real("ease_factor").notNull().default(2.5),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).notNull().defaultNow(),
  correctStreak: integer("correct_streak").notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  lastResult: boolean("last_result"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().defaultNow(),
  wordsReviewed: integer("words_reviewed").notNull().default(0),
  wordsCorrect: integer("words_correct").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
});

export const reviewLog = pgTable("review_log", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id, { onDelete: "cascade" }),
  direction: text("direction", { enum: directionEnum }).notNull(),
  correct: boolean("correct").notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const streak = pgTable("streak", {
  id: serial("id").primaryKey(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastSessionDate: date("last_session_date"),
});
