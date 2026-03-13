"use client";

import LogoutButton from "@/components/logout-button";
import { useEffect, useState } from "react";

type Topic = {
    id: string;
    category: string;
    telegraphPath: string;
    updatedAt: string;
};

const emptyForm = {
    id: "",
    category: "",
    telegraphPath: "",
};

const CATEGORY_OPTIONS = [
    { label: "Glossário", value: "GLOSSARIO" },
    { label: "Interpretações Gnósticas", value: "INTERPRETACOES_GNOSTICAS" },
    { label: "Artigos", value: "ARTIGO" },
    { label: "Patrística", value: "PATRISTICA" },
    { label: "Sugestões de Leitura", value: "SUGESTOES_DE_LEITURA" },
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
        void loadTopics(true);
    }, []);

    function fillForm(topic: Topic) {
        setForm({
            id: topic.id,
            category: topic.category,
            telegraphPath: topic.telegraphPath ?? "",
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
            category: form.category,
            telegraphPath: form.telegraphPath.trim(),
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

    function getCategoryLabel(category: string) {
        return (
            CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category
        );
    }

    return (
        <main className="min-h-screen bg-black p-6 text-white md:p-10">
            <div className="mx-auto max-w-6xl">
                <div className="flex w-full justify-between">
                    <h1 className="text-3xl font-semibold">Admin • Tópicos</h1>
                    <LogoutButton />
                </div>
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
                                <label className="mb-2 block text-sm">Categoria</label>
                                <select
                                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none min-h-12.5! max-h-12.5! h-full"
                                    value={form.category}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, category: e.target.value }))
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
                                <label className="mb-2 block text-sm">Telegraph Path</label>
                                <input
                                    placeholder="Ex.: Otavio-de-Minucio-Felix-02-26"
                                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                                    value={form.telegraphPath}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, telegraphPath: e.target.value }))
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
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
                        <h2 className="text-xl font-medium">Tópicos cadastrados</h2>

                        {loading ? (
                            <p className="mt-4 text-white/60">Carregando...</p>
                        ) : topics.length === 0 ? (
                            <p className="mt-4 text-white/60">
                                Nenhum tópico cadastrado ainda.
                            </p>
                        ) : (
                            <div className="mt-5 space-y-3">
                                {topics.map((topic) => (
                                    <div
                                        key={topic.id}
                                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="text-sm text-white/50">
                                                    {getCategoryLabel(topic.category)}
                                                </div>

                                                <h3 className="mt-1 break-all text-lg font-medium">
                                                    {topic.telegraphPath}
                                                </h3>

                                                <div className="mt-3 text-xs text-white/40">
                                                    Atualizado em{" "}
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