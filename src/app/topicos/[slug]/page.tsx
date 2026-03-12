/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TelegraphRenderer, { type TgNode } from "@/components/TelegraphRenderer";

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
        next: { revalidate: 60 },
    });

    const data: TgResponse = await res.json();

    if (!data.ok || !data.result) {
        throw new Error("Telegraph: falha ao buscar página");
    }

    return data.result;
}

function isTgNode(value: unknown): value is TgNode {
    if (typeof value === "string") return true;

    if (!value || typeof value !== "object") return false;

    const node = value as {
        tag?: unknown;
        attrs?: unknown;
        children?: unknown;
    };

    if (typeof node.tag !== "string") return false;

    if (node.attrs !== undefined && (typeof node.attrs !== "object" || node.attrs === null)) {
        return false;
    }

    if (node.children !== undefined) {
        if (!Array.isArray(node.children)) return false;
        if (!node.children.every(isTgNode)) return false;
    }

    return true;
}

function parseManualContent(content: unknown): TgNode[] | null {
    if (!Array.isArray(content)) return null;

    const validNodes = content.filter(isTgNode);

    return validNodes.length > 0 ? validNodes : null;
}

export default async function TopicPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const topic = await prisma.topic.findUnique({
        where: { slug },
    });

    if (!topic) return notFound();

    let tg: TgResponse["result"] | null = null;

    if (topic.contentType === "telegraph" && topic.telegraphPath) {
        try {
            tg = await getTelegraphPage(topic.telegraphPath);
        } catch (error) {
            console.error("Erro ao carregar Telegraph:", error);
        }
    }

    const manualContent = parseManualContent(topic.content);

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

                    {topic.summary && <p className="mt-3 text-muted">{topic.summary}</p>}

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
                    {topic.contentType === "telegraph" && tg ? (
                        <div className="rounded-2xl border border-border bg-panel/25 p-6">
                            <TelegraphRenderer content={tg.content} />
                        </div>
                    ) : topic.contentType === "manual" && manualContent ? (
                        <div className="rounded-2xl border border-border bg-panel/25 p-6">
                            <TelegraphRenderer content={manualContent} />
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border bg-panel/25 p-6 text-muted">
                            Este tópico ainda não tem conteúdo disponível.
                        </div>
                    )}
                </section>

                <footer className="mt-10 border-t border-border pt-6 text-xs text-muted/70">
                    Atualizado em {new Date(topic.updatedAt).toLocaleDateString("pt-BR")}
                </footer>
            </div>
        </main>
    );
}