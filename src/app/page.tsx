import Link from "next/link";
import { TOPICS, type TopicCategory } from "@/content/topics";

const CATEGORIES: Array<{
  key: TopicCategory;
  title: string;
  desc: string;
}> = [
    { key: "Versículos", title: "Versículos", desc: "Textos bíblicos e contexto imediato." },
    { key: "Reformadores", title: "Reformadores", desc: "Trechos e citações com referência." },
    { key: "Fontes Gnósticas", title: "Fontes Gnósticas", desc: "Textos e paralelos históricos." },
    { key: "Notas Históricas", title: "Notas Históricas", desc: "Linha do tempo, termos e explicações." },
  ];

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function Home() {
  const query = ""; // versão enxuta (sem estado). Depois eu te passo a busca com useState em 30s.

  const recent = [...TOPICS]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-bg bg-grid">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* Top bar */}
        <header className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.18em] text-muted/80">
                REFERÊNCIAS DO DEBATE
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-gold md:text-5xl">
                As Origens Gnósticas do Calvinismo
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                Navegação rápida por tópicos, citações e fontes — ideal para abrir pelo QR Code durante o debate.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/modo-palco"
                className="rounded-xl border border-border bg-panel/40 px-4 py-2 text-sm text-gold hover:bg-panel/60"
              >
                Modo Palco
              </Link>
              <Link
                href="/topicos"
                className="rounded-xl border border-border bg-panel/40 px-4 py-2 text-sm text-text/90 hover:bg-panel/60"
              >
                Ver tudo
              </Link>
            </div>
          </div>

          {/* Search (visual only, enxuto) */}
          <div className="rounded-2xl border border-border bg-panel/45 p-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl border border-border bg-panel/60" />
              <div className="flex-1">
                <div className="text-xs text-muted">Busca rápida</div>
                <div className="text-sm text-text/90">
                  (Depois a gente liga com estado) — título, tags, referência…
                </div>
              </div>
              <div className="hidden sm:block text-xs text-muted/80">
                Ex.: “Romanos 9”, “Calvino”, “Plotino”
              </div>
            </div>
          </div>
        </header>

        {/* Categories */}
        <section className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2">
          {CATEGORIES.map((c) => {
            const count = TOPICS.filter((t) => t.category === c.key).length;

            return (
              <Link
                key={c.key}
                href={`/topicos?cat=${encodeURIComponent(c.key)}`}
                className="group rounded-2xl border border-border bg-panel/35 p-6 backdrop-blur hover:bg-panel/55"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-text">
                      {c.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{c.desc}</p>
                  </div>

                  <div className="rounded-full border border-border bg-panel/60 px-3 py-1 text-xs text-muted">
                    {count} itens
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-gold group-hover:underline">
                    Abrir
                  </span>
                  <span className="text-xs text-muted/70">
                    Clique para navegar
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        {/* Recent */}
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-text">Últimos itens</h3>
            <Link href="/topicos" className="text-sm text-muted hover:text-text">
              Ver tudo →
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recent.map((t) => (
              <Link
                key={t.id}
                href={`/topicos/${t.slug}`}
                className="rounded-2xl border border-border bg-panel/35 p-5 hover:bg-panel/55"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted">{t.category}</div>
                    <div className="mt-1 text-base font-medium text-text">
                      {t.title}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {t.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border bg-panel/60 px-2.5 py-1 text-xs text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted/70">{t.updatedAt}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Mobile actions */}
        <div className="mt-10 flex gap-2 md:hidden">
          <Link
            href="/modo-palco"
            className="flex-1 rounded-xl border border-border bg-panel/40 px-4 py-3 text-center text-sm text-gold hover:bg-panel/60"
          >
            Modo Palco
          </Link>
          <Link
            href="/topicos"
            className="flex-1 rounded-xl border border-border bg-panel/40 px-4 py-3 text-center text-sm text-text/90 hover:bg-panel/60"
          >
            Ver tudo
          </Link>
        </div>

        <footer className="mt-10 border-t border-border pt-6 text-xs text-muted/70">
          Dica: coloque o QR apontando para esta página e use “Modo Palco” para navegação rápida durante o debate.
        </footer>
      </div>
    </main>
  );
}