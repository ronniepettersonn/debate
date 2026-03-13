import Link from "next/link";
import { prisma } from "@/lib/prisma";

type TgTitleResponse = {
  ok: boolean;
  result?: {
    title: string;
  };
};

async function getTelegraphTitle(path: string) {
  const url = `https://api.telegra.ph/getPage/${encodeURIComponent(path)}?return_content=false`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error("Falha ao buscar título no Telegraph");
    }

    const data: TgTitleResponse = await res.json();

    if (!data.ok || !data.result) {
      throw new Error("Resposta inválida do Telegraph");
    }

    return data.result.title;
  } catch (error) {
    console.error(`Erro ao buscar título do Telegraph para ${path}:`, error);
    return "Título indisponível";
  }
}

export default async function Home() {
  const topics = await prisma.topic.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      telegraphPath: true,
      category: true,
      updatedAt: true,
    },
  });

  const topicsWithTitle = await Promise.all(
    topics.map(async (topic) => {
      const title = await getTelegraphTitle(topic.telegraphPath);

      return {
        ...topic,
        title,
      };
    })
  );

  const articles = topicsWithTitle.filter((t) => t.category === "ARTIGO");
  const interpretacoesGnosticas = topicsWithTitle.filter(
    (t) => t.category === "INTERPRETACOES_GNOSTICAS"
  );
  const patristica = topicsWithTitle.filter((t) => t.category === "PATRISTICA");
  const sugestoesDeLeitura = topicsWithTitle.filter(
    (t) => t.category === "SUGESTOES_DE_LEITURA"
  );
  const glossario = topicsWithTitle.filter((t) => t.category === "GLOSSARIO");

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
          id="artigos"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gold">Artigos</h2>
            </div>

            {/* <Link
              href="/topicos"
              className="rounded-xl border border-border bg-panel/40 px-4 py-2 text-sm text-text/90 transition hover:bg-panel/60"
            >
              Ver todos
            </Link> */}
          </div>

          {/* EXEMPLO DO CARD QUE TINHA ANTES */}

          {/* <Link
                  key={t.id}
                  href={`/topicos/${t.slug}`}
                  className="rounded-2xl border border-border bg-panel/45 p-5 transition hover:bg-panel/60"
                  >
                  <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                  
                  <h3 className="mt-1 text-base font-medium text-text">
                  {t.title}
                  </h3>
                  
                  </div>
                  
                  </div>
                  </Link> */}

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {articles.length > 0 ? (
              articles.map((t) => (
                <Link key={t.id} href={`/topicos/${t.id}`} className="rounded-2xl ">
                  <ul className="flex items-start justify-between gap-4 list-disc pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {t.title}
                      </h3>
                    </li>
                  </ul>
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
          id="interpretacoes-gnosticas"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >
          <h2 className="text-2xl font-semibold text-gold">
            Interpretações Gnósticas
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {interpretacoesGnosticas.length > 0 ? (
              interpretacoesGnosticas.map((t) => (
                <Link key={t.id} href={`/topicos/${t.id}`} className="rounded-2xl ">
                  <ul className="flex items-start justify-between gap-4 list-disc pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {t.title}
                      </h3>
                    </li>
                  </ul>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-panel/45 p-5 text-sm text-muted md:col-span-2">
                Nenhum tópico cadastrado nessa sessão ainda.
              </div>
            )}
          </div>
        </section>

        <section
          id="patristica"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >
          <h2 className="text-2xl font-semibold text-gold">Patrística</h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {patristica.length > 0 ? (
              patristica.map((t) => (
                <Link key={t.id} href={`/topicos/${t.id}`} className="rounded-2xl ">
                  <ul className="flex items-start justify-between gap-4 list-disc pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {t.title}
                      </h3>
                    </li>
                  </ul>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-panel/45 p-5 text-sm text-muted md:col-span-2">
                Nenhum tópico cadastrado nessa sessão ainda.
              </div>
            )}
          </div>
        </section>

        <section
          id="sugestoes-de-leitura"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >
          <h2 className=" text-2xl font-semibold text-gold">
            Sugestões de Leitura
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {sugestoesDeLeitura.length > 0 ? (
              sugestoesDeLeitura.map((t) => (
                <Link key={t.id} href={`/topicos/${t.id}`} className="rounded-2xl ">
                  <ul className="flex items-start justify-between gap-4 list-disc pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {t.title}
                      </h3>
                    </li>
                  </ul>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-panel/45 p-5 text-sm text-muted md:col-span-2">
                Nenhum tópico cadastrado nessa sessão ainda.
              </div>
            )}
          </div>
        </section>

        <section
          id="glossario"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >
          <h2 className=" text-2xl font-semibold text-gold">Glossário</h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {glossario.length > 0 ? (
              glossario.map((t) => (
                <Link key={t.id} href={`/topicos/${t.id}`} className="rounded-2xl ">
                  <ul className="flex items-start justify-between gap-4 list-disc pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {t.title}
                      </h3>
                    </li>
                  </ul>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-panel/45 p-5 text-sm text-muted md:col-span-2">
                Nenhum tópico cadastrado nessa sessão ainda.
              </div>
            )}
          </div>
        </section>

        <footer className="mt-8 border-t border-border pt-6 text-xs text-muted/70">
          Dica: essa estrutura deixa o menu sempre acessível no mobile sem
          esconder a navegação.
        </footer>
      </div>
    </main>
  );
}