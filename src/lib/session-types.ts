import type { Direction } from "@/db/schema";

export type ExerciseKind = "multiple_choice" | "typing";

export type SessionItem = {
  wordId: number;
  direction: Direction;
  kind: ExerciseKind;
  prompt: string;
  correctAnswer: string;
  choices?: string[];
  isFalseCognate: boolean;
  falseMeaningNote: string | null;
};
