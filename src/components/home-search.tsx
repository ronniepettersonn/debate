"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/ga";

type SearchOccurrence = {
    occurrenceIndex: number;
    excerpt: string;
    fragmentId: string;
    start: number;
    end: number;
    matchText: string;
};

type SearchResult = {
    id: string;
    title: string | null;
    category: string;
    telegraphPath: string | null;
    youtubeUrl: string | null;
    updatedAt: string;
    displayOrder: number | null;
    excerpt: string;
    occurrences: SearchOccurrence[];
    occurrencesCount: number;
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

function getTopicBaseHref(result: SearchResult) {
    switch (result.category) {
        case "ARTIGO":
            return `/artigos/${result.id}`;
        case "INTERPRETACOES_GNOSTICAS":
            return `/interpretacoes-gnosticas/${result.id}`;
        case "PATRISTICA":
            return `/patristica/${result.id}`;
        case "SUGESTOES_DE_LEITURA":
            return `/sugestoes-de-leitura/${result.id}`;
        case "GLOSSARIO":
            return `/glossario/${result.id}`;
        default:
            return "#";
    }
}

function getTopicHref(result: SearchResult, query: string, fragmentId?: string) {
    const encodedQuery = encodeURIComponent(query);
    const baseHref = getTopicBaseHref(result);

    if (baseHref === "#") return "#";

    return fragmentId
        ? `${baseHref}?q=${encodedQuery}#${fragmentId}`
        : `${baseHref}?q=${encodedQuery}`;
}

export default function HomeSearch() {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const lastTrackedSearchRef = useRef("");

    function normalizeForComparison(value: string) {
        return value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function highlightText(text: string, query: string) {
        if (!query.trim()) return text;

        const normalizedQuery = normalizeForComparison(query.trim());

        const regex = /[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu;
        const parts = text.match(regex) ?? [text];

        return parts.map((part, index) => {
            const isWord = /[\p{L}\p{N}]+/u.test(part);

            if (isWord && normalizeForComparison(part) === normalizedQuery) {
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

                if (lastTrackedSearchRef.current !== debouncedQuery) {
                    trackEvent("search", {
                        search_term: debouncedQuery,
                        results_count: data.results.length,
                    });

                    lastTrackedSearchRef.current = debouncedQuery;
                }
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

        const totalOccurrences = results.reduce((acc, result) => {
            if (result.category === "VIDEOS") return acc + 1;
            return acc + Math.max(result.occurrencesCount || 0, result.excerpt ? 1 : 0);
        }, 0);

        return `${results.length} artigo(s)/resultado(s) e ${totalOccurrences} ocorrência(s) encontrada(s)`;
    }, [debouncedQuery, results]);

    return (
        <section className="mt-6 rounded-3xl border border-border bg-panel/35 p-5 backdrop-blur md:p-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-gold">
                        Pesquisar no conteúdo
                    </h2>
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

                                const normalizedOccurrences =
                                    result.occurrences && result.occurrences.length > 0
                                        ? result.occurrences
                                        : result.excerpt
                                            ? [
                                                {
                                                    occurrenceIndex: 1,
                                                    excerpt: result.excerpt,
                                                    fragmentId: "",
                                                    start: 0,
                                                    end: 0,
                                                    matchText: "",
                                                },
                                            ]
                                            : [];

                                const primaryOccurrence = normalizedOccurrences[0];
                                const otherOccurrences = normalizedOccurrences.slice(1);

                                const mainHref = getTopicHref(
                                    result,
                                    debouncedQuery,
                                    primaryOccurrence?.fragmentId || undefined
                                );

                                const mainExcerpt =
                                    primaryOccurrence?.excerpt || result.excerpt || "";

                                if (result.category === "VIDEOS") {
                                    return (
                                        <a
                                            key={result.id}
                                            href={result.youtubeUrl ?? "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-2xl border border-border bg-panel/45 p-4 transition hover:bg-panel/65"
                                            onClick={() =>
                                                trackEvent("video_result_click", {
                                                    search_term: debouncedQuery,
                                                    result_id: result.id,
                                                    result_title: title,
                                                    result_category: result.category,
                                                    video_url: result.youtubeUrl ?? "",
                                                })
                                            }
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

                                const handleMainResultClick = () => {
                                    trackEvent("search_result_click", {
                                        search_term: debouncedQuery,
                                        result_id: result.id,
                                        result_title: title,
                                        result_category: result.category,
                                        occurrence_index:
                                            primaryOccurrence?.occurrenceIndex ?? 1,
                                        destination: mainHref,
                                    });
                                };

                                return (
                                    <div
                                        key={result.id}
                                        className="rounded-2xl border border-border bg-panel/45 p-4 transition hover:bg-panel/65"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="text-xs uppercase tracking-[0.14em] text-muted/80">
                                                {normalizeCategoryLabel(result.category)}
                                            </div>

                                            <Link
                                                href={mainHref}
                                                className="block"
                                                onClick={handleMainResultClick}
                                            >
                                                <h3 className="text-base font-medium text-text">
                                                    {highlightText(title, debouncedQuery)}
                                                </h3>
                                            </Link>

                                            {mainExcerpt ? (
                                                <Link
                                                    href={mainHref}
                                                    className="block"
                                                    onClick={handleMainResultClick}
                                                >
                                                    <p className="text-sm leading-6 text-muted">
                                                        {highlightText(mainExcerpt, debouncedQuery)}
                                                    </p>
                                                </Link>
                                            ) : null}

                                            {otherOccurrences.length > 0 && (
                                                <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3">
                                                    <div className="text-xs uppercase tracking-[0.14em] text-muted/70">
                                                        Outras ocorrências no artigo
                                                    </div>

                                                    {otherOccurrences.map((occurrence) => {
                                                        const occurrenceHref = getTopicHref(
                                                            result,
                                                            debouncedQuery,
                                                            occurrence.fragmentId || undefined
                                                        );

                                                        return (
                                                            <Link
                                                                key={`${result.id}-${occurrence.fragmentId || occurrence.occurrenceIndex}`}
                                                                href={occurrenceHref}
                                                                className="rounded-xl border border-border/60 bg-panel/30 p-3 text-sm leading-6 text-muted transition hover:bg-panel/50"
                                                                onClick={() =>
                                                                    trackEvent(
                                                                        "search_result_click",
                                                                        {
                                                                            search_term:
                                                                                debouncedQuery,
                                                                            result_id: result.id,
                                                                            result_title: title,
                                                                            result_category:
                                                                                result.category,
                                                                            occurrence_index:
                                                                                occurrence.occurrenceIndex,
                                                                            destination:
                                                                                occurrenceHref,
                                                                        }
                                                                    )
                                                                }
                                                            >
                                                                {highlightText(
                                                                    occurrence.excerpt,
                                                                    debouncedQuery
                                                                )}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}