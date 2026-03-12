"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/auth/logout", {
            method: "POST",
        });

        router.push("/login");
        router.refresh();
    }

    return (
        <button
            onClick={handleLogout}
            className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
        >
            Sair
        </button>
    );
}