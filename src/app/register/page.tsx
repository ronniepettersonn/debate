"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);
        setError("");

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        setLoading(false);

        if (!res.ok) {
            setError(data.error || "Erro ao registrar");
            return;
        }

        router.push("/login");
    }

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6"
            >
                <h1 className="text-2xl font-semibold">Criar conta</h1>

                <div className="mt-6">
                    <label className="mb-2 block text-sm">Nome</label>
                    <input
                        type="text"
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="mt-4">
                    <label className="mb-2 block text-sm">E-mail</label>
                    <input
                        type="email"
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="mt-4">
                    <label className="mb-2 block text-sm">Senha</label>
                    <input
                        type="password"
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {error && (
                    <p className="mt-4 text-sm text-red-400">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full rounded-xl bg-white text-black px-4 py-3 font-medium disabled:opacity-60"
                >
                    {loading ? "Criando conta..." : "Criar conta"}
                </button>

                <p className="mt-4 text-sm text-white/60">
                    Já tem conta?{" "}
                    <a href="/login" className="underline">
                        Entrar
                    </a>
                </p>
            </form>
        </main>
    );
}