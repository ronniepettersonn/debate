"use client";

import { useEffect } from "react";

type Props = {
    containerId: string;
};

export default function ScrollToSearchOccurrence({ containerId }: Props) {
    useEffect(() => {
        if (typeof window === "undefined") return;

        let attempts = 0;
        const maxAttempts = 40;

        const tryScroll = () => {
            attempts += 1;

            const hash = window.location.hash?.replace(/^#/, "");
            if (!hash) return;

            const container = document.getElementById(containerId);
            if (!container) {
                if (attempts < maxAttempts) {
                    window.setTimeout(tryScroll, 120);
                }
                return;
            }

            const target =
                document.getElementById(hash) ||
                container.querySelector<HTMLElement>(`#${CSS.escape(hash)}`);

            if (!target) {
                if (attempts < maxAttempts) {
                    window.setTimeout(tryScroll, 120);
                }
                return;
            }

            const headerOffset = 120;
            const rect = target.getBoundingClientRect();
            const absoluteTop = window.scrollY + rect.top - headerOffset;

            window.scrollTo({
                top: absoluteTop,
                behavior: "smooth",
            });

            target.classList.add("ring-2", "ring-gold/50", "rounded");

            window.setTimeout(() => {
                target.classList.remove("ring-2", "ring-gold/50", "rounded");
            }, 2200);
        };

        const timer = window.setTimeout(tryScroll, 350);

        return () => window.clearTimeout(timer);
    }, [containerId]);

    return null;
}