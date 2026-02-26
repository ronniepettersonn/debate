import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPICS } from "@/content/topics";

export default async function TopicPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const topic = TOPICS.find((t) => t.slug === slug);
    if (!topic) return notFound();

    return (
        <main className="min-h-screen bg-bg">
            <div className="mx-auto max-w-3xl px-4 py-10">
                <Link href="/modo-palco" className="text-sm text-muted hover:text-text">
                    ← Voltar
                </Link>

                <div className="mt-4">
                    <div className="text-xs text-muted">{topic.category}</div>
                    <h1 className="mt-1 text-3xl font-semibold text-gold">{topic.title}</h1>
                    <p className="mt-3 text-muted">{topic.summary}</p>
                </div>

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

                <section className="mt-8 space-y-6">
                    {topic.blocks.map((block, i) => {
                        if (block.type === "tese") {
                            return (
                                <div key={i} className="rounded-2xl border border-border bg-panel/40 p-6">
                                    <h2 className="text-lg font-semibold text-text">{block.title}</h2>
                                    <p className="mt-3 leading-relaxed text-muted">{block.content}</p>
                                </div>
                            );
                        }

                        if (block.type === "citacao") {
                            return (
                                <div key={i} className="rounded-2xl border border-border bg-panel/40 p-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <h2 className="text-lg font-semibold text-text">{block.title}</h2>
                                        <span className="text-sm text-muted">{block.reference}</span>
                                    </div>

                                    <blockquote className="mt-4 border-l-2 border-gold pl-4 text-text/90">
                                        {block.quote}
                                    </blockquote>

                                    {"url" in block && block.url && (
                                        <a
                                            href={block.url}
                                            target="_blank"
                                            className="mt-4 inline-block text-sm text-gold hover:underline"
                                        >
                                            Abrir fonte →
                                        </a>
                                    )}
                                </div>
                            );
                        }

                        if (block.type === "lista") {
                            return (
                                <div key={i} className="rounded-2xl border border-border bg-panel/40 p-6">
                                    <h2 className="text-lg font-semibold text-text">{block.title}</h2>
                                    <ul className="mt-4 space-y-2 text-muted">
                                        {block.items.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="rounded-xl border border-border bg-panel/50 px-4 py-3"
                                            >
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        }

                        return null;
                    })}
                </section>

                <footer className="mt-10 border-t border-border pt-6 text-xs text-muted/70">
                    Atualizado em {topic.updatedAt}
                </footer>
            </div>
        </main>
    );
}