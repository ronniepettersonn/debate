"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import clsx from "clsx";
import {
    FaBaby,
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
    { href: "/#batismo_infantil", label: "Batismo Infantil", icon: <FaBaby /> },
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

function getHashSnapshot() {
    if (typeof window === "undefined") return "";
    return window.location.hash || "";
}

function subscribeToHashChange(callback: () => void) {
    if (typeof window === "undefined") return () => { };

    window.addEventListener("hashchange", callback);
    window.addEventListener("popstate", callback);

    return () => {
        window.removeEventListener("hashchange", callback);
        window.removeEventListener("popstate", callback);
    };
}

function getActiveHref(pathname: string, currentHash: string) {
    if (pathname === "/") {
        if (currentHash) return `/${currentHash}`;
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

    if (pathname.startsWith("/batismo-infantil/")) {
        return "/#batismo-infantil";
    }

    if (pathname.startsWith("/videos/")) {
        return "/#videos";
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

    const currentHash = useSyncExternalStore(
        subscribeToHashChange,
        getHashSnapshot,
        () => ""
    );

    const normalizedHash = pathname === "/" ? currentHash : "";

    const activeHref = useMemo(() => {
        return getActiveHref(pathname, normalizedHash);
    }, [pathname, normalizedHash]);

    const renderItems = (isMobileMenu = false) =>
        MENU_ITEMS.map((item) => {
            const isActive = item.href === activeHref;

            const className = clsx(
                "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm transition",
                isActive
                    ? "border border-border bg-panel/70 text-gold"
                    : "border border-transparent text-text/90 hover:border-border hover:bg-panel/55"
            );

            const handleClick = (
                e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
            ) => {
                const isHomeAnchor = item.href.startsWith("/#");

                if (isHomeAnchor && pathname === "/") {
                    e.preventDefault();

                    const hash = item.href.replace("/#", "");
                    const section = document.getElementById(hash);

                    if (section) {
                        section.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    } else if (hash === "topo") {
                        window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                        });
                    }

                    window.history.replaceState(null, "", `/#${hash}`);
                    window.dispatchEvent(new HashChangeEvent("hashchange"));

                    if (isMobileMenu) onClose();
                    return;
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
                    <span className="grid h-5 w-5 shrink-0 place-items-center text-base leading-none">
                        {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                </Link>
            );
        });

    return (
        <>
            <aside className="hidden md:block md:w-[18rem] pl-4">
                <div className="sticky top-6 rounded-3xl border border-border bg-panel/45 p-3 backdrop-blur">
                    <div className="mb-3 rounded-2xl border border-border bg-panel/55 px-4 py-3">
                        <div className="text-xs tracking-[0.18em] text-muted/80">
                            REFERÊNCIAS
                        </div>
                        <div className="mt-1 text-sm font-medium text-gold">Menu</div>
                    </div>

                    <nav className="flex flex-col gap-2">{renderItems(false)}</nav>

                    <div className="my-4 flex w-full items-center justify-center px-4">
                        <Link
                            href="https://loja.natanrufino.com/checkouts/cn/hWN9wR27UWTLZohz6VSh1Pyk/pt-br?_r=AQABhEUVbyI5pl1Yn9FZhzFvMQnLDuWNpP_9NuAfS5QSK9I&cart_link_id=czcXu2H5"
                            className="w-full rounded-2xl bg-gold py-2 text-center font-semibold text-panel transition hover:cursor-pointer hover:bg-gold/70"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            COMPRAR LIVRO
                        </Link>
                    </div>
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

                            <div className="my-4 flex w-full items-center justify-center px-4">
                                <Link
                                    href="https://loja.natanrufino.com/checkouts/cn/hWN9wR27UWTLZohz6VSh1Pyk/pt-br?_r=AQABhEUVbyI5pl1Yn9FZhzFvMQnLDuWNpP_9NuAfS5QSK9I&cart_link_id=czcXu2H5"
                                    className="w-full rounded-2xl bg-gold py-2 text-center font-semibold text-panel transition hover:cursor-pointer hover:bg-gold/70"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    COMPRAR LIVRO
                                </Link>
                            </div>

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