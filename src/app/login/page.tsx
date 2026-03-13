"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PiEye, PiEyeClosed } from "react-icons/pi";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [see, setSee] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        setLoading(false);

        if (!res.ok) {
            setError(data.error || "Erro ao entrar");
            return;
        }

        router.push("/admin");
        router.refresh();
    }

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6"
            >
                <h1 className="text-2xl font-semibold">Entrar</h1>

                <div className="mt-6">
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
                    <div className="relative">

                        <input
                            type={!see ? 'password' : 'text'}
                            className="w-full rounded-xl pr-15 border border-white/10 bg-black/30 px-4 py-3 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {
                            password ?
                                !see ? (
                                    <button className="absolute right-5 bottom-0 top-0 text-white/40" type="button" onClick={() => setSee(true)}>
                                        <PiEye size={24} />
                                    </button>
                                ) : (
                                    <button className="absolute right-5 bottom-0 top-0 text-white/40" type="button" onClick={() => setSee(false)}>
                                        <PiEyeClosed size={24} />
                                    </button>
                                ) : null
                        }
                    </div>
                </div>

                {error && (
                    <p className="mt-4 text-sm text-red-400">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full rounded-xl bg-white text-black px-4 py-3 font-medium disabled:opacity-60"
                >
                    {loading ? "Entrando..." : "Entrar"}
                </button>
            </form>
        </main>
    );
}