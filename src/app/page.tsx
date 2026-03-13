import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HomeLayoutShell from "@/components/home-layout-shell";

export default async function Home() {
  const topics = await prisma.topic.findMany({
    where: {
      published: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      summary: true,
      tags: true,
      updatedAt: true,
    },
  });

  const recentArticles = topics.slice(0, 8);

  return (
    <main className="min-h-screen bg-bg bg-grid text-text">

      <div className="mx-auto max-w-6xl px-2 py-3 md:px-2 md:py-3">
        <section
          id="topo"
          className="rounded-3xl border border-border bg-panel/45 p-5 backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs tracking-[0.18em] text-muted/80">
                  REFERÊNCIAS DO DEBATE
                </p>

                <h1 className="mt-2 text-3xl font-semibold text-gold md:text-5xl">
                  As Origens Gnósticas do Calvinismo
                </h1>

                {/* <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                  Uma navegação em formato de landing page para consulta rápida
                  durante o debate, com acesso a glossário, interpretações
                  gnósticas, artigos, patrística e sugestões de leitura.
                </p> */}
              </div>

              {/* <div className="flex flex-wrap gap-2">
                <Link
                  href="/modo-palco"
                  className="rounded-xl border border-border bg-panel/40 px-4 py-2 text-sm text-gold transition hover:bg-panel/60"
                >
                  Modo Palco
                </Link>

                <Link
                  href="/topicos"
                  className="rounded-xl border border-border bg-panel/40 px-4 py-2 text-sm text-text/90 transition hover:bg-panel/60"
                >
                  Ver todos os tópicos
                </Link>
              </div> */}
            </div>
          </div>
        </section>

        <section
          id="glossario"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >

          <h2 className=" text-2xl font-semibold text-gold">Glossário</h2>
        </section>

        <section
          id="interpretacoes-gnosticas"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >

          <h2 className="text-2xl font-semibold text-gold">
            Interpretações Gnósticas
          </h2>
        </section>

        <section
          id="artigos"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gold">
                Artigos
              </h2>
            </div>

            {/* <Link
              href="/topicos"
              className="rounded-xl border border-border bg-panel/40 px-4 py-2 text-sm text-text/90 transition hover:bg-panel/60"
            >
              Ver todos
            </Link> */}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {recentArticles.length > 0 ? (
              recentArticles.map((t) => (
                <Link
                  key={t.id}
                  href={`/topicos/${t.slug}`}
                  className="rounded-2xl border border-border bg-panel/45 p-5 transition hover:bg-panel/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      {/* <div className="text-xs text-muted">{t.category}</div> */}

                      <h3 className="mt-1 text-base font-medium text-text">
                        {t.title}
                      </h3>

                      {t.summary && (
                        <p className="mt-2 line-clamp-3 text-sm text-muted">
                          {t.summary}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {/* {t.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border bg-panel/60 px-2.5 py-1 text-xs text-muted"
                          >
                            {tag}
                          </span>
                        ))} */}
                      </div>
                    </div>

                    {/* <div className="shrink-0 text-xs text-muted/70">
                      {new Date(t.updatedAt).toLocaleDateString("pt-BR")}
                    </div> */}
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-panel/45 p-5 text-sm text-muted md:col-span-2">
                Nenhum artigo publicado ainda.
              </div>
            )}
          </div>
        </section>

        <section
          id="patristica"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >

          <h2 className="text-2xl font-semibold text-gold">
            Patrística
          </h2>
        </section>

        <section
          id="sugestoes-de-leitura"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >

          <h2 className=" text-2xl font-semibold text-gold">
            Sugestões de Leitura
          </h2>
        </section>

        <footer className="mt-8 border-t border-border pt-6 text-xs text-muted/70">
          Dica: essa estrutura deixa o menu sempre acessível no mobile sem
          esconder a navegação.
        </footer>
      </div>
    </main >
  );
}