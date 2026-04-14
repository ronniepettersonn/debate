"use client";

import LogoutButton from "@/components/logout-button";
import { useEffect, useMemo, useState } from "react";
export const dynamic = "force-dynamic";

type Topic = {
    id: string;
    title?: string | null;
    category: string;
    telegraphPath?: string | null;
    youtubeUrl?: string | null;
    updatedAt: string;
    display?: {
        id: string;
        topicId: string;
        category: string;
        displayOrder: number;
    } | null;
};

type TopicForm = {
    id: string;
    category: string;
    telegraphPath: string;
    displayOrder: string;
    youtubeUrl: string;
};

const emptyForm: TopicForm = {
    id: "",
    category: "",
    telegraphPath: "",
    displayOrder: "",
    youtubeUrl: "",
};

const CATEGORY_OPTIONS = [
    { label: "Glossário", value: "GLOSSARIO" },
    { label: "Interpretações Gnósticas", value: "INTERPRETACOES_GNOSTICAS" },
    { label: "Artigos", value: "ARTIGO" },
    { label: "Patrística", value: "PATRISTICA" },
    { label: "Batismo Infantil", value: "BATISMO_INFANTIL" },
    { label: "Vídeos", value: "VIDEOS" },
    { label: "Sugestões de Leitura", value: "SUGESTOES_DE_LEITURA" },
];

export default function AdminTopicsPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [movingId, setMovingId] = useState<string>("");
    const [error, setError] = useState("");
    const [filterCategory, setFilterCategory] = useState("TODAS");
    const [form, setForm] = useState<TopicForm>(emptyForm);

    const isVideoCategory = form.category === "VIDEOS";

    async function loadTopics(showLoading = false) {
        if (showLoading) setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/topics", {
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao carregar tópicos.");
                return;
            }

            setTopics(data);
        } catch {
            setError("Erro ao carregar tópicos.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadTopics(true);
    }, []);

    function fillForm(topic: Topic) {
        setForm({
            id: topic.id,
            category: topic.category ?? "",
            telegraphPath: topic.telegraphPath ?? "",
            displayOrder:
                typeof topic.display?.displayOrder === "number"
                    ? String(topic.display.displayOrder)
                    : "",
            youtubeUrl: topic.youtubeUrl ?? "",
        });
        setError("");
    }

    function resetForm() {
        setForm(emptyForm);
        setError("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const normalizedCategory = form.category.trim();
        const normalizedTelegraphPath = form.telegraphPath.trim();
        const normalizedYoutubeUrl = form.youtubeUrl.trim();
        const parsedDisplayOrder = parseInt(form.displayOrder, 10);

        if (!normalizedCategory) {
            setError("Selecione uma categoria.");
            setSaving(false);
            return;
        }

        if (!isVideoCategory && !normalizedTelegraphPath) {
            setError("Informe o Telegraph Path.");
            setSaving(false);
            return;
        }

        if (Number.isNaN(parsedDisplayOrder) || parsedDisplayOrder < 1) {
            setError("Informe uma ordem válida maior que zero.");
            setSaving(false);
            return;
        }

        if (normalizedCategory === "VIDEOS" && !normalizedYoutubeUrl) {
            setError("Informe a URL do YouTube para tópicos da categoria Vídeos.");
            setSaving(false);
            return;
        }

        const payload = {
            category: normalizedCategory,
            telegraphPath: normalizedTelegraphPath || null,
            displayOrder: parsedDisplayOrder,
            youtubeUrl: isVideoCategory ? normalizedYoutubeUrl || null : null,
        };

        const isEditing = Boolean(form.id);

        try {
            const res = await fetch(
                isEditing ? `/api/admin/topics/${form.id}` : "/api/admin/topics",
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao salvar tópico.");
                return;
            }

            resetForm();
            await loadTopics(true);
        } catch {
            setError("Erro ao salvar tópico.");
        } finally {
            setSaving(false);
        }
    }

    async function handleMove(topic: Topic, direction: "up" | "down") {
        const hasOrder = typeof topic.display?.displayOrder === "number";

        if (!hasOrder) {
            setError("Esse tópico não possui ordem cadastrada para ser reordenado.");
            return;
        }

        setMovingId(topic.id);
        setError("");

        try {
            const res = await fetch(`/api/admin/topics/${topic.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ direction }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao reordenar tópico.");
                return;
            }

            await loadTopics(false);
        } catch {
            setError("Erro ao reordenar tópico.");
        } finally {
            setMovingId("");
        }
    }

    async function handleDelete(id: string) {
        const ok = window.confirm("Deseja realmente excluir este tópico?");
        if (!ok) return;

        try {
            const res = await fetch(`/api/admin/topics/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao excluir tópico.");
                return;
            }

            if (form.id === id) resetForm();
            await loadTopics(true);
        } catch {
            setError("Erro ao excluir tópico.");
        }
    }

    function getCategoryLabel(category: string) {
        return (
            CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category
        );
    }

    const filteredTopics = useMemo(() => {
        const base =
            filterCategory === "TODAS"
                ? topics
                : topics.filter((topic) => topic.category === filterCategory);

        return [...base].sort((a, b) => {
            const categoryCompare = a.category.localeCompare(b.category);

            if (filterCategory === "TODAS" && categoryCompare !== 0) {
                return categoryCompare;
            }

            const orderA = a.display?.displayOrder ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.display?.displayOrder ?? Number.MAX_SAFE_INTEGER;

            if (orderA !== orderB) return orderA - orderB;

            const textA = (a.title || a.telegraphPath || a.youtubeUrl || "").toLowerCase();
            const textB = (b.title || b.telegraphPath || b.youtubeUrl || "").toLowerCase();

            return textA.localeCompare(textB);
        });
    }, [topics, filterCategory]);

    return (
        <main className="min-h-screen bg-black p-6 text-white md:p-10">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold">Admin • Tópicos</h1>
                        <p className="mt-2 text-white/60">
                            Cadastro, edição e organização dos tópicos do debate.
                        </p>
                    </div>

                    <LogoutButton />
                </div>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="mt-8 grid gap-8 xl:grid-cols-[420px_1fr]">
                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-medium">
                                {form.id ? "Editar tópico" : "Novo tópico"}
                            </h2>

                            {form.id && (
                                <button
                                    onClick={resetForm}
                                    className="text-sm text-white/60 transition hover:text-white"
                                    type="button"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm text-white/80">
                                    Categoria
                                </label>
                                <select
                                    required
                                    className="min-h-12.5! h-full max-h-12.5! w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-white/20"
                                    value={form.category}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            category: e.target.value,
                                            youtubeUrl:
                                                e.target.value === "VIDEOS" ? s.youtubeUrl : "",
                                        }))
                                    }
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {CATEGORY_OPTIONS.map((category) => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-white/80">
                                    Ordem na categoria
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    placeholder="Ex.: 1"
                                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-white/20"
                                    value={form.displayOrder}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            displayOrder: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-white/80">
                                    Telegraph Path{" "}
                                    {isVideoCategory && (
                                        <span className="text-white/40">(opcional para vídeos)</span>
                                    )}
                                </label>
                                <input
                                    required={!isVideoCategory}
                                    placeholder={
                                        isVideoCategory
                                            ? "Opcional para vídeos"
                                            : "Ex.: Otavio-de-Minucio-Felix-02-26"
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-white/20"
                                    value={form.telegraphPath}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            telegraphPath: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            {isVideoCategory && (
                                <div>
                                    <label className="mb-2 block text-sm text-white/80">
                                        URL do YouTube
                                    </label>
                                    <input
                                        type="url"
                                        required={isVideoCategory}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-white/20"
                                        value={form.youtubeUrl}
                                        onChange={(e) =>
                                            setForm((s) => ({
                                                ...s,
                                                youtubeUrl: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-60"
                            >
                                {saving
                                    ? "Salvando..."
                                    : form.id
                                        ? "Atualizar tópico"
                                        : "Criar tópico"}
                            </button>
                        </form>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-xl font-medium">Tópicos cadastrados</h2>
                                <p className="mt-1 text-sm text-white/50">
                                    {loading
                                        ? "Carregando tópicos..."
                                        : `${filteredTopics.length} ${filteredTopics.length === 1 ? "resultado" : "resultados"}`}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <label className="text-sm text-white/70">
                                    Filtrar categoria
                                </label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-white/20"
                                >
                                    <option value="TODAS">Todas as categorias</option>
                                    {CATEGORY_OPTIONS.map((category) => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <p className="mt-6 text-white/60">Carregando...</p>
                        ) : filteredTopics.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
                                <p className="text-white/70">
                                    Nenhum tópico encontrado para o filtro selecionado.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-5 grid gap-4">
                                {filteredTopics.map((topic) => {
                                    const isMovingThis = movingId === topic.id;
                                    const hasOrder =
                                        typeof topic.display?.displayOrder === "number";

                                    return (
                                        <div
                                            key={topic.id}
                                            className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-black/30"
                                        >
                                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                                                            {getCategoryLabel(topic.category)}
                                                        </span>

                                                        {hasOrder ? (
                                                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                                                                Ordem {topic.display?.displayOrder}
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-300">
                                                                Sem ordem
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="mt-3 break-words text-lg font-semibold text-white">
                                                        {topic.title ||
                                                            topic.telegraphPath ||
                                                            (topic.category === "VIDEOS"
                                                                ? "Vídeo sem título"
                                                                : "Tópico sem título")}
                                                    </h3>

                                                    {topic.telegraphPath && (
                                                        <div className="mt-1 break-all text-sm text-white/45">
                                                            {topic.telegraphPath}
                                                        </div>
                                                    )}

                                                    {topic.category === "VIDEOS" && topic.youtubeUrl && (
                                                        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                                            <div className="text-xs uppercase tracking-wide text-white/40">
                                                                URL do YouTube
                                                            </div>
                                                            <div className="mt-1 break-all text-sm text-white/70">
                                                                {topic.youtubeUrl}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/40">
                                                        <span>
                                                            Atualizado em{" "}
                                                            {new Date(topic.updatedAt).toLocaleDateString("pt-BR")}
                                                        </span>

                                                        {topic.display?.category && (
                                                            <span>
                                                                Categoria de exibição: {topic.display.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 flex-wrap gap-2">
                                                    <button
                                                        onClick={() => handleMove(topic, "up")}
                                                        disabled={!hasOrder || isMovingThis}
                                                        aria-disabled={!hasOrder || isMovingThis}
                                                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${!hasOrder || isMovingThis
                                                            ? "cursor-not-allowed border-white/5 text-white/25 opacity-50"
                                                            : "border-white/10 text-white hover:bg-white/5"
                                                            }`}
                                                        type="button"
                                                        title={
                                                            hasOrder
                                                                ? "Subir"
                                                                : "Defina uma ordem antes de reordenar"
                                                        }
                                                    >
                                                        ↑
                                                    </button>

                                                    <button
                                                        onClick={() => handleMove(topic, "down")}
                                                        disabled={!hasOrder || isMovingThis}
                                                        aria-disabled={!hasOrder || isMovingThis}
                                                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${!hasOrder || isMovingThis
                                                            ? "cursor-not-allowed border-white/5 text-white/25 opacity-50"
                                                            : "border-white/10 text-white hover:bg-white/5"
                                                            }`}
                                                        type="button"
                                                        title={
                                                            hasOrder
                                                                ? "Descer"
                                                                : "Defina uma ordem antes de reordenar"
                                                        }
                                                    >
                                                        ↓
                                                    </button>

                                                    <button
                                                        onClick={() => fillForm(topic)}
                                                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
                                                        type="button"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(topic.id)}
                                                        className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                                                        type="button"
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}