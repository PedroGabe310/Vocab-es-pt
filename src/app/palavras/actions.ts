"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { words } from "@/db/schema";

export async function addWord(formData: FormData) {
  const wordEs = String(formData.get("wordEs") ?? "").trim();
  const wordPt = String(formData.get("wordPt") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const isFalseCognate = formData.get("isFalseCognate") === "on";
  const falseMeaningNote = String(formData.get("falseMeaningNote") ?? "").trim() || null;

  if (!wordEs || !wordPt) return;

  await db.insert(words).values({
    wordEs,
    wordPt,
    category,
    isFalseCognate,
    falseMeaningNote,
  });

  revalidatePath("/palavras");
}

export async function deleteWord(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await db.delete(words).where(eq(words.id, id));

  revalidatePath("/palavras");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export async function importWordsCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) return;

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) return;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = header.includes("word_es") ? rows.slice(1) : rows;

  const colIndex = header.includes("word_es")
    ? {
        wordEs: header.indexOf("word_es"),
        wordPt: header.indexOf("word_pt"),
        category: header.indexOf("category"),
        isFalseCognate: header.indexOf("is_false_cognate"),
        falseMeaningNote: header.indexOf("false_meaning_note"),
      }
    : { wordEs: 0, wordPt: 1, category: 2, isFalseCognate: 3, falseMeaningNote: 4 };

  const values = dataRows
    .map((r) => ({
      wordEs: (r[colIndex.wordEs] ?? "").trim(),
      wordPt: (r[colIndex.wordPt] ?? "").trim(),
      category: (r[colIndex.category] ?? "").trim() || null,
      isFalseCognate: ["true", "1", "sim", "yes"].includes(
        (r[colIndex.isFalseCognate] ?? "").trim().toLowerCase(),
      ),
      falseMeaningNote: (r[colIndex.falseMeaningNote] ?? "").trim() || null,
    }))
    .filter((v) => v.wordEs && v.wordPt);

  if (values.length === 0) return;

  await db.insert(words).values(values);

  revalidatePath("/palavras");
}
