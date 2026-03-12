import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import LogoutButton from "@/components/logout-button";

export default async function AdminPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen bg-black text-white p-10">
            <div className="mx-auto max-w-5xl">

                {/* HEADER */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold">Painel Admin</h1>
                        <p className="mt-2 text-white/60">
                            Logado como <span className="text-white">{session.email}</span>
                        </p>
                        <p className="text-sm text-white/40">
                            Perfil: {session.role}
                        </p>
                    </div>

                    <LogoutButton />
                </div>

                {/* MENU */}
                <div className="mt-10 grid gap-4 md:grid-cols-2">

                    <Link
                        href="/admin/topics"
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
                    >
                        <h2 className="text-xl font-medium">Gerenciar Tópicos</h2>
                        <p className="mt-2 text-sm text-white/60">
                            Criar, editar e remover tópicos do debate.
                        </p>
                    </Link>

                </div>

            </div>
        </main>
    );
}