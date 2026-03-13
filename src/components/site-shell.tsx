"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import SiteSidebar from "@/components/site-sidebar";

type SiteShellProps = {
    children: React.ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    const isAdminRoute = pathname.startsWith("/admin");

    if (isAdminRoute) {
        return (
            <div className="min-h-screen bg-bg bg-grid text-text">
                <main className="min-w-0">{children}</main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg bg-grid text-text">
            <div className="sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur md:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Abrir menu"
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-panel/50 text-text"
                    >
                        ☰
                    </button>

                    <div className="text-sm font-medium text-gold">
                        Referências do Debate
                    </div>

                    <div className="w-11" />
                </div>
            </div>

            <div className="mx-auto flex max-w-7xl gap-3 md:gap-4">
                <SiteSidebar
                    mobileOpen={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                />

                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}