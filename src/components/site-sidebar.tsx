"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
    FaBook,
    FaChurch,
    FaHeadSideVirus,
    FaHome,
    FaNewspaper,
    FaVideo,
} from "react-icons/fa";
import { FaBookOpenReader } from "react-icons/fa6";

const MENU_ITEMS = [
    { href: "/#topo", label: "Início", icon: <FaHome /> },
    { href: "/#artigos", label: "Artigos", icon: <FaNewspaper /> },
    {
        href: "/#interpretacoes-gnosticas",
        label: "Interpretações Gnósticas",
        icon: <FaHeadSideVirus />,
    },
    { href: "/#patristica", label: "Patrística", icon: <FaChurch /> },
    { href: "/#videos", label: "Vídeos", icon: <FaVideo /> },
    {
        href: "/#sugestoes-de-leitura",
        label: "Leituras",
        icon: <FaBookOpenReader />,
    },
    { href: "/#glossario", label: "Glossário", icon: <FaBook /> },
] as const;

type SiteSidebarProps = {
    mobileOpen: boolean;
    onClose: () => void;
};

function getCurrentHash() {
    if (typeof window === "undefined") return "";
    return window.location.hash || "";
}

function getActiveHref(pathname: string, currentHash: string) {
    if (pathname === "/") {
        if (currentHash) {
            return `/${currentHash}`;
        }

        return "/#topo";
    }

    if (pathname.startsWith("/artigos/")) {
        return "/#artigos";
    }

    if (pathname.startsWith("/interpretacoes-gnosticas/")) {
        return "/#interpretacoes-gnosticas";
    }

    if (pathname.startsWith("/patristica/")) {
        return "/#patristica";
    }

    if (pathname.startsWith("/sugestoes-de-leitura/")) {
        return "/#sugestoes-de-leitura";
    }

    if (pathname.startsWith("/glossario/")) {
        return "/#glossario";
    }

    return pathname;
}

export default function SiteSidebar({
    mobileOpen,
    onClose,
}: SiteSidebarProps) {
    const pathname = usePathname();
    const [currentHash, setCurrentHash] = useState(() => getCurrentHash());

    useEffect(() => {
        const updateHash = () => {
            setCurrentHash(getCurrentHash());
        };

        window.addEventListener("hashchange", updateHash);

        return () => {
            window.removeEventListener("hashchange", updateHash);
        };
    }, []);

    const activeHref = useMemo(() => {
        return getActiveHref(pathname, currentHash);
    }, [pathname, currentHash]);

    const renderItems = (isMobileMenu = false) =>
        MENU_ITEMS.map((item) => {
            const isActive = item.href === activeHref;

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

            const handleClick = (
                e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
            ) => {
                if (item.href === "/#topo" && pathname === "/") {
                    e.preventDefault();

                    const section = document.getElementById("topo");

                    if (section) {
                        section.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    } else {
                        window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                        });
                    }

                    setCurrentHash("#topo");

                    if (typeof window !== "undefined") {
                        window.history.replaceState(null, "", "/#topo");
                    }

                    if (isMobileMenu) onClose();
                    return;
                }

                if (item.href.startsWith("/#")) {
                    const hash = item.href.replace("/", "");
                    setCurrentHash(hash);
                }

                if (isMobileMenu) onClose();
            };

            return (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleClick}
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