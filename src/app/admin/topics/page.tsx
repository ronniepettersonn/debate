"use client";

import { useEffect, useState } from "react";

type Topic = {
    id: string;
    title: string;
    slug: string;
    category: string;
    summary: string | null;
    tags: string[];
    telegraphPath: string | null;
    published: boolean;
    updatedAt: string;
};


const emptyForm = {
    id: "",
    title: "",
    category: "",
    summary: "",
    tags: "",
    telegraphPath: "",
    published: false,
};

const CATEGORY_OPTIONS = [
    "Glossário",
    "Interpretações Gnósticas",
    "Artigos",
    "Patrística",
    "Sugestões de Leitura"
];

export default function AdminTopicsPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(emptyForm);

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
        async function run() {
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

        void run();
    }, []);

    function fillForm(topic: Topic) {
        setForm({
            id: topic.id,
            title: topic.title,
            category: topic.category,
            summary: topic.summary ?? "",
            tags: topic.tags.join(", "),
            telegraphPath: topic.telegraphPath ?? "",
            published: topic.published,
        });
    }

    function resetForm() {
        setForm(emptyForm);
        setError("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = {
            title: form.title,
            category: form.category,
            summary: form.summary || null,
            tags: form.tags
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            telegraphPath: form.telegraphPath || null,
            published: form.published,
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

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-10">
            <div className="mx-auto max-w-6xl">
                <h1 className="text-3xl font-semibold">Admin • Tópicos</h1>
                <p className="mt-2 text-white/60">
                    Cadastro e edição dos tópicos do debate.
                </p>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-medium">
                                {form.id ? "Editar tópico" : "Novo tópico"}
                            </h2>

                            {form.id && (
                                <button
                                    onClick={resetForm}
                                    className="text-sm text-white/60 hover:text-white"
                                    type="button"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm">Título</label>
                                <input
                                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, title: e.target.value }))
                                    }
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm">Categoria</label>
                                <select
                                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                                    value={form.category}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, category: e.target.value }))
                                    }
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {CATEGORY_OPTIONS.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm">Resumo</label>
                                <textarea
                                    className="min-h-[90px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                                    value={form.summary}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, summary: e.target.value }))
                                    }
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm">
                                    Tags (separadas por vírgula)
                                </label>
                                <input
                                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                                    value={form.tags}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, tags: e.target.value }))
                                    }
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm">Telegraph Path</label>
                                <input
                                    placeholder="Ex.: Otávio-de-Minúcio-Félix-02-26"
                                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                                    value={form.telegraphPath}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, telegraphPath: e.target.value }))
                                    }
                                />
                            </div>

                            <label className="flex items-center gap-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.published}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, published: e.target.checked }))
                                    }
                                />
                                Publicado
                            </label>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
                            >
                                {saving ? "Salvando..." : form.id ? "Atualizar tópico" : "Criar tópico"}
                            </button>
                        </form>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="text-xl font-medium">Tópicos cadastrados</h2>

                        {loading ? (
                            <p className="mt-4 text-white/60">Carregando...</p>
                        ) : topics.length === 0 ? (
                            <p className="mt-4 text-white/60">Nenhum tópico cadastrado ainda.</p>
                        ) : (
                            <div className="mt-5 space-y-3">
                                {topics.map((topic) => (
                                    <div
                                        key={topic.id}
                                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="text-sm text-white/50">{topic.category}</div>
                                                <h3 className="mt-1 text-lg font-medium">{topic.title}</h3>
                                                <p className="mt-1 text-sm text-white/60">{topic.slug}</p>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {topic.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/70"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                {topic.telegraphPath && (
                                                    <div className="mt-3 text-xs text-white/40">
                                                        Telegraph: {topic.telegraphPath}
                                                    </div>
                                                )}

                                                <div className="mt-2 text-xs text-white/40">
                                                    {topic.published ? "Publicado" : "Rascunho"} •{" "}
                                                    {new Date(topic.updatedAt).toLocaleDateString("pt-BR")}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => fillForm(topic)}
                                                    className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                                                    type="button"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(topic.id)}
                                                    className="rounded-xl border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                                                    type="button"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}