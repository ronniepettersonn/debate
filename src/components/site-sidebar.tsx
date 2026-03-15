"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { FaBook, FaChurch, FaHeadSideVirus, FaHome, FaNewspaper, FaPaperPlane } from "react-icons/fa";
import { FaBookOpenReader, FaBookSkull } from "react-icons/fa6";

const MENU_ITEMS = [
    { href: "/", label: "Início", icon: <FaHome /> },
    { href: "/#artigos", label: "Artigos", icon: <FaNewspaper /> },
    { href: "/#interpretacoes-gnosticas", label: "Interpretações Gnósticas", icon: <FaHeadSideVirus /> },
    { href: "/#patristica", label: "Patrística", icon: <FaChurch /> },
    { href: "/#sugestoes-de-leitura", label: "Leituras", icon: <FaBookOpenReader /> },
    { href: "/#glossario", label: "Glossário", icon: <FaBook /> },
    //{ href: "/modo-palco", label: "Modo Palco", icon: "🎤" },
] as const;

type SiteSidebarProps = {
    mobileOpen: boolean;
    onClose: () => void;
};

export default function SiteSidebar({
    mobileOpen,
    onClose,
}: SiteSidebarProps) {
    const pathname = usePathname();

    const renderItems = (isMobileMenu = false) =>
        MENU_ITEMS.map((item) => {
            const isAnchorToHome = item.href.startsWith("/#");
            const isActive =
                item.href === "/"
                    ? pathname === "/"
                    : isAnchorToHome
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

            const className = clsx(
                "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm transition",
                isActive
                    ? "border border-border bg-panel/70 text-gold"
                    : "border border-transparent text-text/90 hover:border-border hover:bg-panel/55"
            );

            const content = (
                <>
                    <span className="grid h-5 w-5 shrink-0 place-items-center text-base leading-none">
                        {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                </>
            );

            if (isAnchorToHome) {
                return (
                    <a
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                            if (isMobileMenu) onClose();
                        }}
                        className={className}
                    >
                        {content}
                    </a>
                );
            }

            return (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                        if (isMobileMenu) onClose();
                    }}
                    className={className}
                >
                    {content}
                </Link>
            );
        });

    return (
        <>
            <aside className="hidden md:block md:w-[18rem]">
                <div className="sticky top-6 rounded-3xl border border-border bg-panel/45 p-3 backdrop-blur">
                    <div className="mb-3 rounded-2xl border border-border bg-panel/55 px-4 py-3">
                        <div className="text-xs tracking-[0.18em] text-muted/80">
                            REFERÊNCIAS
                        </div>
                        <div className="mt-1 text-sm font-medium text-gold">Menu</div>
                    </div>

                    <nav className="flex flex-col gap-2">{renderItems(false)}</nav>
                </div>
            </aside>

            {mobileOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Fechar menu"
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    />

                    <aside className="fixed left-3 top-3 z-50 h-[calc(100dvh-24px)] w-[17rem] md:hidden">
                        <div className="flex h-full flex-col rounded-3xl border border-border bg-panel/95 p-3 backdrop-blur">
                            <button
                                type="button"
                                onClick={onClose}
                                className="mb-3 flex h-12 items-center gap-3 rounded-2xl border border-border bg-panel/55 px-4 text-sm text-text"
                            >
                                <span className="grid h-5 w-5 place-items-center text-base">
                                    ✕
                                </span>
                                <span>Fechar menu</span>
                            </button>

                            <nav className="flex flex-col gap-2">{renderItems(true)}</nav>

                            <div className="mt-auto rounded-2xl border border-border bg-panel/40 p-3 text-xs text-muted">
                                Navegação rápida entre as seções e páginas.
                            </div>
                        </div>
                    </aside>
                </>
            )}
        </>
    );
}