"use client";

import clsx from "clsx";

const ITEMS = [
    {
        href: "#glossario",
        label: "Glossário",
        icon: "📘",
    },
    {
        href: "#interpretacoes-gnosticas",
        label: "Interpretações",
        icon: "🧩",
    },
    {
        href: "#artigos",
        label: "Artigos",
        icon: "📝",
    },
    {
        href: "#patristica",
        label: "Patrística",
        icon: "⛪",
    },
    {
        href: "#sugestoes-de-leitura",
        label: "Leituras",
        icon: "📚",
    },
] as const;

type HomeSideNavProps = {
    expanded: boolean;
    isMobile: boolean;
    onToggle: () => void;
    onClose: () => void;
};

export default function HomeSideNav({
    expanded,
    isMobile,
    onToggle,
    onClose,
}: HomeSideNavProps) {
    return (
        <aside
            className={clsx(
                "fixed left-3 top-3 z-50 h-[calc(100vh-24px)] rounded-3xl border border-border bg-panel/80 p-3 backdrop-blur transition-all duration-300",
                expanded ? "w-64" : "w-20"
            )}
        >
            <div className="flex h-full flex-col gap-3">
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-panel/50 px-3 text-sm text-text transition hover:bg-panel/70"
                >
                    <span className="grid h-6 w-6 place-items-center text-base">☰</span>
                    {expanded && <span>Menu</span>}
                </button>

                <nav className="flex flex-col gap-2">
                    {ITEMS.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                                if (isMobile) onClose();
                            }}
                            className="flex h-12 items-center gap-3 rounded-2xl border border-transparent px-3 text-sm text-text/90 transition hover:border-border hover:bg-panel/65"
                            title={item.label}
                        >
                            <span className="grid h-6 w-6 place-items-center text-base">
                                {item.icon}
                            </span>

                            {expanded && <span className="truncate">{item.label}</span>}
                        </a>
                    ))}
                </nav>

                <div className="mt-auto rounded-2xl border border-border bg-panel/40 p-3 text-xs text-muted">
                    {expanded ? "Navegação rápida entre as seções." : "•"}
                </div>
            </div>
        </aside>
    );
}