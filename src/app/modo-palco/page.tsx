"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TOPICS, type Topic, type TopicCategory } from "@/content/topics";

type CategoryFilter = TopicCategory | "Todas";

const FILTERS: Array<{ key: CategoryFilter; label: string; hotkey: string }> = [
    { key: "Todas", label: "Todas", hotkey: "0" },
    { key: "Versículos", label: "Versículos", hotkey: "1" },
    { key: "Reformadores", label: "Reformadores", hotkey: "2" },
    { key: "Fontes Gnósticas", label: "Fontes Gnósticas", hotkey: "3" },
    { key: "Notas Históricas", label: "Notas Históricas", hotkey: "4" },
];

function normalize(s: string) {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
}

function topicMatchesQuery(t: Topic, q: string) {
    if (!q) return true;
    const n = normalize(q);
    const hay = normalize([t.title, t.category, ...(t.tags ?? [])].join(" "));
    return hay.includes(n);
}

export default function ModoPalcoPage() {
    const [query, setQuery] = useState("");
    const [cat, setCat] = useState<CategoryFilter>("Todas");
    const inputRef = useRef<HTMLInputElement | null>(null);

    const sorted = useMemo(() => {
        return [...TOPICS].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }, []);

    const filtered = useMemo(() => {
        return sorted.filter((t) => {
            const catOk = cat === "Todas" ? true : t.category === cat;
            const qOk = topicMatchesQuery(t, query);
            return catOk && qOk;
        });
    }, [sorted, cat, query]);

    const totalCount = TOPICS.length;
    const showingCount = filtered.length;

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            // "/" foca na busca (tipo Notion)
            if (e.key === "/") {
                e.preventDefault();
                inputRef.current?.focus();
                return;
            }

            // Esc limpa
            if (e.key === "Escape") {
                setQuery("");
                setCat("Todas");
                inputRef.current?.blur();
                return;
            }

            // 0-4 filtros
            const hit = FILTERS.find((f) => f.hotkey === e.key);
            if (hit) {
                setCat(hit.key);
                return;
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <main className="min-h-screen bg-bg">
            <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
                {/* Header */}
                <header className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs tracking-[0.18em] text-muted/80">
                                MODO PALCO
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-gold md:text-4xl">
                                Navegação Rápida
                            </h1>
                            <p className="mt-2 text-sm text-muted md:text-base">
                                Use <span className="text-text/90">/</span> para buscar,{" "}
                                <span className="text-text/90">1–4</span> para filtrar,{" "}
                                <span className="text-text/90">Esc</span> para limpar.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/"
                                className="rounded-xl border border-border bg-panel/40 px-4 py-2 text-sm text-text/90 hover:bg-panel/60"
                            >
                                ← Voltar
                            </Link>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="rounded-2xl border border-border bg-panel/45 p-3 backdrop-blur">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="flex flex-1 items-center gap-3">
                                <div className="h-10 w-10 shrink-0 rounded-xl border border-border bg-panel/60" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder='Buscar… ex: "Romanos 9", "Calvino", "Plotino"  (atalho: /)'
                                    className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted/60 md:text-base"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3 md:justify-end">
                                <div className="text-xs text-muted/80 md:text-sm">
                                    Mostrando{" "}
                                    <span className="text-text/90">{showingCount}</span> de{" "}
                                    <span className="text-text/90">{totalCount}</span>
                                </div>

                                <button
                                    onClick={() => {
                                        setQuery("");
                                        setCat("Todas");
                                        inputRef.current?.focus();
                                    }}
                                    className="rounded-xl border border-border bg-panel/40 px-3 py-2 text-xs text-muted hover:bg-panel/60 md:text-sm"
                                >
                                    Limpar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map((f) => {
                            const active = cat === f.key;
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => setCat(f.key)}
                                    className={[
                                        "rounded-full border px-3 py-2 text-xs md:text-sm",
                                        active
                                            ? "border-gold bg-panel/70 text-gold"
                                            : "border-border bg-panel/40 text-muted hover:bg-panel/60",
                                    ].join(" ")}
                                >
                                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-panel/70 text-[10px] text-muted">
                                        {f.hotkey}
                                    </span>
                                    {f.label}
                                </button>
                            );
                        })}
                    </div>
                </header>

                {/* List */}
                <section className="mt-6 grid gap-3 md:grid-cols-2">
                    {filtered.map((t) => (
                        <Link
                            key={t.id}
                            href={`/topicos/${t.slug}`}
                            className="group rounded-2xl border border-border bg-panel/35 p-5 hover:bg-panel/55"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs text-muted">{t.category}</div>
                                    <div className="mt-1 text-lg font-medium text-text group-hover:text-gold">
                                        {t.title}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {t.tags.slice(0, 4).map((tag) => (
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
                </section>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div className="mt-8 rounded-2xl border border-border bg-panel/35 p-6 text-muted">
                        Nada encontrado. Tente outro termo ou pressione <span className="text-text/90">Esc</span> para limpar.
                    </div>
                )}

                <footer className="mt-10 border-t border-border pt-6 text-xs text-muted/70">
                    Dica: no debate, deixe essa tela aberta e use <span className="text-text/90">/</span> + digitação rápida.
                </footer>
            </div>
        </main>
    );
}