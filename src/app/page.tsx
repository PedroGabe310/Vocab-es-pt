import { db } from "@/db";
import { words } from "@/db/schema";

export default async function Home() {
  const allWords = await db.select().from(words);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Vocab Trainer ES ↔ PT
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Conexão com o banco OK. {allWords.length} palavra(s) cadastrada(s).
      </p>
    </div>
  );
}
