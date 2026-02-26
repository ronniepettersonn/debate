/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPICS } from "@/content/topics";
import TelegraphRenderer from "@/components/TelegraphRenderer";

type TgResponse = {
    ok: boolean;
    result?: {
        title: string;
        author_name?: string;
        url: string;
        content: any[];
    };
};

async function getTelegraphPage(path: string) {
    const url = `https://api.telegra.ph/getPage/${encodeURIComponent(path)}?return_content=true`;

    const res = await fetch(url, {
        // cache bom pra debate: atualiza a cada 60s (ajuste como quiser)
        next: { revalidate: 60 },
    });

    const data: TgResponse = await res.json();
    if (!data.ok || !data.result) throw new Error("Telegraph: falha ao buscar página");
    return data.result;
}

export default async function TopicPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const topic = TOPICS.find((t) => t.slug === slug);
    if (!topic) return notFound();

    const tg = topic.telegraphPath ? await getTelegraphPage(topic.telegraphPath) : null;

    return (
        <main className="min-h-screen bg-bg">
            <div className="mx-auto max-w-3xl px-4 py-10">
                <Link href="/modo-palco" className="text-sm text-muted hover:text-text">
                    ← Voltar
                </Link>

                <div className="mt-4">
                    <div className="text-xs text-muted">{topic.category}</div>
                    <h1 className="mt-1 text-3xl font-semibold text-gold">
                        {tg?.title ?? topic.title}
                    </h1>

                    <p className="mt-3 text-muted">{topic.summary}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {topic.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-border bg-panel/40 px-3 py-1 text-xs text-muted"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {tg?.url && (
                        <a
                            href={tg.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-4 inline-block text-sm text-gold hover:underline"
                        >
                            Ver no Telegraph →
                        </a>
                    )}
                </div>

                <section className="mt-8">
                    {tg ? (
                        <div className="rounded-2xl border border-border bg-panel/25 p-6">
                            <TelegraphRenderer content={tg.content} />
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border bg-panel/25 p-6 text-muted">
                            Este tópico ainda não tem conteúdo do Telegraph vinculado.
                        </div>
                    )}
                </section>

                <footer className="mt-10 border-t border-border pt-6 text-xs text-muted/70">
                    Atualizado em {topic.updatedAt}
                </footer>
            </div>
        </main>
    );
}