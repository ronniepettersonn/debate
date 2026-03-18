"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SearchResult = {
    id: string;
    title: string | null;
    category: string;
    telegraphPath: string | null;
    youtubeUrl: string | null;
    updatedAt: string;
    displayOrder: number | null;
    excerpt: string;
};

type SearchResponse = {
    query: string;
    total: number;
    results: SearchResult[];
};

function normalizeCategoryLabel(category: string) {
    switch (category) {
        case "ARTIGO":
            return "Artigos";
        case "INTERPRETACOES_GNOSTICAS":
            return "Interpretações Gnósticas";
        case "PATRISTICA":
            return "Patrística";
        case "VIDEOS":
            return "Vídeos";
        case "SUGESTOES_DE_LEITURA":
            return "Sugestões de Leitura";
        case "GLOSSARIO":
            return "Glossário";
        default:
            return category;
    }
}

function getTopicHref(result: SearchResult, query: string) {
    const encodedQuery = encodeURIComponent(query);

    switch (result.category) {
        case "ARTIGO":
            return `/artigos/${result.id}?q=${encodedQuery}`;
        case "INTERPRETACOES_GNOSTICAS":
            return `/interpretacoes-gnosticas/${result.id}?q=${encodedQuery}`;
        case "PATRISTICA":
            return `/patristica/${result.id}?q=${encodedQuery}`;
        case "SUGESTOES_DE_LEITURA":
            return `/sugestoes-de-leitura/${result.id}?q=${encodedQuery}`;
        case "GLOSSARIO":
            return `/glossario/${result.id}?q=${encodedQuery}`;
        default:
            return "#";
    }
}

export default function HomeSearch() {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    function escapeRegExp(value: string) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function highlightText(text: string, query: string) {
        if (!query.trim()) return text;

        const regex = new RegExp(`(${escapeRegExp(query)})`, "ig");
        const parts = text.split(regex);

        return parts.map((part, index) => {
            if (part.toLowerCase() === query.toLowerCase()) {
                return (
                    <mark
                        key={`${part}-${index}`}
                        className="rounded bg-gold/25 px-1 text-gold"
                    >
                        {part}
                    </mark>
                );
            }

            return <span key={`${part}-${index}`}>{part}</span>;
        });
    }

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 350);

        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        async function runSearch() {
            if (!debouncedQuery) {
                setResults([]);
                setLoading(false);
                setHasSearched(false);
                return;
            }

            try {
                setLoading(true);
                setHasSearched(true);

                const res = await fetch(
                    `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                if (!res.ok) {
                    throw new Error("Falha ao buscar resultados.");
                }

                const data: SearchResponse = await res.json();
                setResults(data.results);
            } catch (error) {
                console.error(error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }

        runSearch();
    }, [debouncedQuery]);

    const totalLabel = useMemo(() => {
        if (!debouncedQuery) return "";
        return `${results.length} resultado(s) encontrado(s)`;
    }, [debouncedQuery, results.length]);

    return (
        <section className="mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8">
            <div className="flex flex-col gap-4">
                <div>
                    {/* <p className="text-xs tracking-[0.18em] text-muted/80">BUSCA</p> */}
                    <h2 className=" text-2xl font-semibold text-gold">
                        Pesquisar no conteúdo
                    </h2>
                    {/* <p className="mt-2 text-sm text-muted">
                        Pesquise por título, categoria ou palavras presentes nos textos.
                    </p> */}
                </div>

                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Digite uma palavra-chave..."
                        className="h-12 w-full rounded-2xl border border-border bg-panel/60 px-4 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-gold"
                    />

                    {loading && (
                        <div className="rounded-2xl border border-border bg-panel/45 p-4 text-sm text-muted">
                            Buscando...
                        </div>
                    )}

                    {!loading && debouncedQuery && (
                        <div className="text-sm text-muted">{totalLabel}</div>
                    )}

                    {!loading && hasSearched && debouncedQuery && results.length === 0 && (
                        <div className="rounded-2xl border border-border bg-panel/45 p-4 text-sm text-muted">
                            Nenhum resultado encontrado para <strong>{debouncedQuery}</strong>.
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="grid gap-3">
                            {results.map((result) => {
                                const title =
                                    result.title?.trim() ||
                                    (result.category === "VIDEOS"
                                        ? "Vídeo sem título"
                                        : "Título indisponível");

                                if (result.category === "VIDEOS") {
                                    return (
                                        <a
                                            key={result.id}
                                            href={result.youtubeUrl ?? "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-2xl border border-border bg-panel/45 p-4 transition hover:bg-panel/65"
                                        >
                                            <div className="flex flex-col gap-2">
                                                <div className="text-xs uppercase tracking-[0.14em] text-muted/80">
                                                    {normalizeCategoryLabel(result.category)}
                                                </div>

                                                <h3 className="text-base font-medium text-text">
                                                    {highlightText(title, debouncedQuery)}
                                                </h3>

                                                {result.excerpt ? (
                                                    <p className="text-sm leading-6 text-muted">
                                                        {highlightText(result.excerpt, debouncedQuery)}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </a>
                                    );
                                }

                                return (
                                    <Link
                                        key={result.id}
                                        href={getTopicHref(result, debouncedQuery)}
                                        className="rounded-2xl border border-border bg-panel/45 p-4 transition hover:bg-panel/65"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="text-xs uppercase tracking-[0.14em] text-muted/80">
                                                {normalizeCategoryLabel(result.category)}
                                            </div>

                                            <h3 className="text-base font-medium text-text">
                                                {highlightText(title, debouncedQuery)}
                                            </h3>

                                            {result.excerpt ? (
                                                <p className="text-sm leading-6 text-muted">
                                                    {highlightText(result.excerpt, debouncedQuery)}
                                                </p>
                                            ) : null}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}