/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TelegraphRenderer, { type TgNode } from "@/components/TelegraphRenderer";
import type { Metadata } from "next";
import SearchHighlight from "@/components/search-highlight";

type TgResponse = {
    ok: boolean;
    result?: {
        title: string;
        author_name?: string;
        url: string;
        content: any[];
    };
};

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    const topic =
        (await prisma.topic.findUnique({
            where: { id },
            select: { title: true },
        })) ??
        (await prisma.topic.findUnique({
            where: { telegraphPath: id },
            select: { title: true },
        }));

    return {
        title: topic?.title ?? "Artigo",
    };
}

async function getTelegraphPage(path: string) {
    const url = `https://api.telegra.ph/getPage/${encodeURIComponent(
        path
    )}?return_content=true`;

    const res = await fetch(url, {
        next: { revalidate: 60 },
    });

    if (!res.ok) {
        throw new Error("Telegraph: falha na resposta da API");
    }

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

    if (
        node.attrs !== undefined &&
        (typeof node.attrs !== "object" || node.attrs === null)
    ) {
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

export default async function TopicPage({ params, searchParams }: Props) {
    const { id } = await params;
    const { q = "" } = await searchParams;

    const topic =
        (await prisma.topic.findUnique({
            where: { id },
        })) ??
        (await prisma.topic.findUnique({
            where: { telegraphPath: id },
        }));

    if (!topic) return notFound();

    const savedContent = parseManualContent(topic.content);
    let tg: TgResponse["result"] | null = null;

    // Busca no Telegraph só como fallback, caso o banco esteja vazio
    if (!savedContent && topic.telegraphPath) {
        try {
            tg = await getTelegraphPage(topic.telegraphPath);
        } catch (error) {
            console.error("Erro ao carregar Telegraph:", error);
        }
    }

    const title = topic.title?.trim() || tg?.title || "Sem título";
    const contentToRender = savedContent ?? tg?.content ?? null;

    return (
        <>
            <SearchHighlight query={q} containerId="article-content" />

            <main className="min-h-screen bg-bg text-text">
                <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-10">
                    <header className="mb-8 md:mb-10">
                        <h1 className="my-4 text-3xl font-semibold leading-tight text-gold md:text-5xl">
                            {title}
                        </h1>
                    </header>

                    <section className="min-w-0">
                        {contentToRender ? (
                            <article
                                id="article-content"
                                className="mx-auto w-full max-w-3xl"
                            >
                                <TelegraphRenderer content={contentToRender} />
                            </article>
                        ) : (
                            <div className="mx-auto max-w-3xl text-muted">
                                Este tópico ainda não tem conteúdo disponível.
                            </div>
                        )}
                    </section>

                    <footer className="mx-auto mt-12 max-w-3xl border-t border-border pt-6 text-xs text-muted/70">
                        Atualizado em{" "}
                        {new Date(topic.updatedAt).toLocaleDateString("pt-BR")}
                    </footer>
                </div>
            </main>
        </>
    );
}