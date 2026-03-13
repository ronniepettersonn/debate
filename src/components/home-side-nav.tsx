"use client";

import clsx from "clsx";

const ITEMS = [
    { href: "#glossario", label: "Glossário", icon: "📘" },
    { href: "#interpretacoes-gnosticas", label: "Interpretações", icon: "🧩" },
    { href: "#artigos", label: "Artigos", icon: "📝" },
    { href: "#patristica", label: "Patrística", icon: "⛪" },
    { href: "#sugestoes-de-leitura", label: "Leituras", icon: "📚" },
] as const;

type HomeSideNavProps = {
    expanded: boolean;
    isMobile: boolean;
    onToggle: () => void;
    onClose: () => void;
    overlay?: boolean;
};

export default function HomeSideNav({
    expanded,
    isMobile,
    onToggle,
    onClose,
    overlay = false,
}: HomeSideNavProps) {
    return (
        <aside
            className={clsx(
                "rounded-3xl border border-border bg-panel/45 backdrop-blur transition-all duration-300",
                overlay
                    ? "h-full w-full p-3 shadow-2xl"
                    : expanded
                        ? "h-[calc(100vh-48px)] w-[17rem] p-3.5"
                        : "h-[calc(100dvh-24px)] p-3 md:h-[calc(100vh-48px)] w-[4.5rem]"
            )}
        >
            <div className="flex h-full flex-col gap-3">
                <button
                    type="button"
                    onClick={onToggle}
                    className={clsx(
                        "flex items-center rounded-2xl border border-border bg-panel/55 text-text transition hover:bg-panel/65",
                        expanded || overlay
                            ? "h-12 justify-start gap-3 px-4"
                            : "h-12 w-full justify-center px-0"
                    )}
                >
                    <span className="grid h-6 w-6 place-items-center text-base leading-none">
                        ☰
                    </span>
                    {(expanded || overlay) && (
                        <span className="text-sm font-medium">Menu</span>
                    )}
                </button>

                <nav className="flex flex-col gap-2">
                    {ITEMS.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            title={item.label}
                            onClick={(e) => {
                                const id = item.href.replace("#", "");
                                const target = document.getElementById(id);

                                if (target) {
                                    e.preventDefault();
                                    target.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                                }

                                if (isMobile) {
                                    onClose();
                                }
                            }}
                            className={clsx(
                                "flex items-center rounded-2xl border border-transparent text-text/90 transition hover:border-border hover:bg-panel/60",
                                expanded || overlay
                                    ? "h-12 justify-start gap-3 px-4"
                                    : "h-12 w-full justify-center px-0"
                            )}
                        >
                            <span className="grid h-7 w-7 shrink-0 place-items-center text-lg leading-none">
                                {item.icon}
                            </span>

                            {(expanded || overlay) && (
                                <span className="truncate text-sm font-medium">{item.label}</span>
                            )}
                        </a>
                    ))}
                </nav>

                <div
                    className={clsx(
                        "mt-auto rounded-2xl border border-border bg-panel/40 text-xs text-muted flex items-center justify-center",
                        expanded || overlay ? "p-3" : "py-3 text-center"
                    )}
                >
                    {expanded || overlay
                        ? "Navegação rápida entre as seções."
                        : "•"}
                </div>
            </div>
        </aside>
    );
}