import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HomeSearch from "@/components/home-search";

type TopicWithDisplay = {
  id: string;
  title: string | null;
  telegraphPath: string | null;
  category: string;
  youtubeUrl: string | null;
  updatedAt: Date;
  display: {
    id: string;
    topicId: string;
    category: string;
    displayOrder: number;
  } | null;
};

function sortByDisplayOrder<T extends { display: { displayOrder: number } | null }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    const orderA = a.display?.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.display?.displayOrder ?? Number.MAX_SAFE_INTEGER;

    return orderA - orderB;
  });
}

function getFallbackTitle(topic: TopicWithDisplay) {
  if (topic.title?.trim()) {
    return topic.title;
  }

  if (topic.category === "VIDEOS") {
    return "Vídeo sem título";
  }

  return "Título indisponível";
}

export default async function Home() {
  const topics = await prisma.topic.findMany({
    select: {
      id: true,
      title: true,
      telegraphPath: true,
      category: true,
      youtubeUrl: true,
      updatedAt: true,
      display: {
        select: {
          id: true,
          topicId: true,
          category: true,
          displayOrder: true,
        },
      },
    },
  });

  const articles = sortByDisplayOrder(
    topics.filter((t) => t.category === "ARTIGO")
  );

  const videos = sortByDisplayOrder(
    topics.filter((t) => t.category === "VIDEOS" && t.youtubeUrl)
  );

  const interpretacoesGnosticas = sortByDisplayOrder(
    topics.filter((t) => t.category === "INTERPRETACOES_GNOSTICAS")
  );

  const patristica = sortByDisplayOrder(
    topics.filter((t) => t.category === "PATRISTICA")
  );

  const sugestoesDeLeitura = sortByDisplayOrder(
    topics.filter((t) => t.category === "SUGESTOES_DE_LEITURA")
  );

  const glossario = sortByDisplayOrder(
    topics.filter((t) => t.category === "GLOSSARIO")
  );

  return (
    <main className="min-h-screen bg-bg bg-grid text-text">
      <div className="mx-auto max-w-6xl px-2 pb-3 pt-6 md:pr-4 md:pt-6">
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
              </div>
            </div>
          </div>
        </section>

        <HomeSearch />

        <section
          id="artigos"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gold">Artigos</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {articles.length > 0 ? (
              articles.map((t) => (
                <Link key={t.id} href={`/artigos/${t.id}`} className="rounded-2xl">
                  <ul className="flex list-disc items-start justify-between gap-4 pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {getFallbackTitle(t)}
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

          <div className="mt-6 grid gap-3">
            {interpretacoesGnosticas.length > 0 ? (
              interpretacoesGnosticas.map((t) => (
                <Link
                  key={t.id}
                  href={`/interpretacoes-gnosticas/${t.id}`}
                  className="rounded-2xl"
                >
                  <ul className="flex list-disc items-start justify-between gap-4 pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {getFallbackTitle(t)}
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

          <div className="mt-6 grid gap-3">
            {patristica.length > 0 ? (
              patristica.map((t) => (
                <Link key={t.id} href={`/patristica/${t.id}`} className="rounded-2xl">
                  <ul className="flex list-disc items-start justify-between gap-4 pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {getFallbackTitle(t)}
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
          id="videos"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >
          <h2 className="text-2xl font-semibold text-gold">Vídeos</h2>

          <div className="mt-6 grid gap-3">
            {videos.length > 0 ? (
              videos.map((t) => (
                <a
                  key={t.id}
                  href={t.youtubeUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl"
                >
                  <ul className="flex list-disc items-start justify-between gap-4 pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {getFallbackTitle(t)}
                      </h3>
                    </li>
                  </ul>
                </a>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-panel/45 p-5 text-sm text-muted md:col-span-2">
                Nenhum vídeo cadastrado ainda.
              </div>
            )}
          </div>
        </section>

        <section
          id="sugestoes-de-leitura"
          className="scroll-mt-24 mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8"
        >
          <h2 className="text-2xl font-semibold text-gold">
            Sugestões de Leitura
          </h2>

          <div className="mt-6 grid gap-3">
            {sugestoesDeLeitura.length > 0 ? (
              sugestoesDeLeitura.map((t) => (
                <Link
                  key={t.id}
                  href={`/sugestoes-de-leitura/${t.id}`}
                  className="rounded-2xl"
                >
                  <ul className="flex list-disc items-start justify-between gap-4 pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {getFallbackTitle(t)}
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
          <h2 className="text-2xl font-semibold text-gold">Glossário</h2>

          <div className="mt-6 grid gap-3">
            {glossario.length > 0 ? (
              glossario.map((t) => (
                <Link key={t.id} href={`/glossario/${t.id}`} className="rounded-2xl">
                  <ul className="flex list-disc items-start justify-between gap-4 pl-6">
                    <li className="min-w-0">
                      <h3 className="mt-1 text-base font-medium text-text">
                        {getFallbackTitle(t)}
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

        <footer className="mt-8 flex justify-center gap-1 border-t border-border px-4 pb-4 pt-6 text-xs text-muted/70">
          <div>
            Todos os direitos reservador a{" "}
            <Link href="https://natanrufino.com.br" target="_blank">
              Natan Rufino
            </Link>
            .
          </div>
          <div>
            Desenvolvido por{" "}
            <Link href="https://ronniepettersonn.com.br" target="_blank">
              Ronnie Pettersonn
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}