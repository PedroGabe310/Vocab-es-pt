import { desc } from "drizzle-orm";
import { db } from "@/db";
import { words } from "@/db/schema";
import { addWord, deleteWord, importWordsCsv } from "./actions";

export default async function PalavrasPage() {
  const allWords = await db.select().from(words).orderBy(desc(words.createdAt));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Palavras ({allWords.length})
      </h1>

      <section className="flex flex-col gap-4 rounded-lg border border-black/[.08] p-5 dark:border-white/[.145]">
        <h2 className="font-medium text-black dark:text-zinc-50">Adicionar palavra</h2>
        <form action={addWord} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              name="wordEs"
              placeholder="Palavra em espanhol"
              required
              className="flex-1 rounded border border-black/[.15] bg-transparent px-3 py-2 text-sm dark:border-white/[.2]"
            />
            <input
              name="wordPt"
              placeholder="Tradução em português"
              required
              className="flex-1 rounded border border-black/[.15] bg-transparent px-3 py-2 text-sm dark:border-white/[.2]"
            />
          </div>
          <input
            name="category"
            placeholder="Categoria (opcional)"
            className="rounded border border-black/[.15] bg-transparent px-3 py-2 text-sm dark:border-white/[.2]"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" name="isFalseCognate" />
            É falso cognato
          </label>
          <input
            name="falseMeaningNote"
            placeholder="Nota sobre o falso cognato (opcional)"
            className="rounded border border-black/[.15] bg-transparent px-3 py-2 text-sm dark:border-white/[.2]"
          />
          <button
            type="submit"
            className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Adicionar
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-black/[.08] p-5 dark:border-white/[.145]">
        <h2 className="font-medium text-black dark:text-zinc-50">Importar CSV</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Colunas esperadas: word_es, word_pt, category, is_false_cognate, false_meaning_note
        </p>
        <form action={importWordsCsv} className="flex items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="text-sm"
          />
          <button
            type="submit"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Importar
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-black dark:text-zinc-50">Lista</h2>
        <div className="flex flex-col divide-y divide-black/[.08] dark:divide-white/[.145]">
          {allWords.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-black dark:text-zinc-50">{w.wordEs}</span>
                  <span className="text-zinc-500">→</span>
                  <span className="text-black dark:text-zinc-50">{w.wordPt}</span>
                  {w.isFalseCognate && (
                    <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      falso cognato
                    </span>
                  )}
                </div>
                {w.category && (
                  <div className="text-xs text-zinc-500">{w.category}</div>
                )}
                {w.falseMeaningNote && (
                  <div className="text-xs text-zinc-500">{w.falseMeaningNote}</div>
                )}
              </div>
              <form action={deleteWord}>
                <input type="hidden" name="id" value={w.id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  remover
                </button>
              </form>
            </div>
          ))}
          {allWords.length === 0 && (
            <p className="py-6 text-sm text-zinc-500">Nenhuma palavra cadastrada ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}
