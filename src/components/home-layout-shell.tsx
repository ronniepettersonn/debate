"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import HomeSideNav from "@/components/home-side-nav";

type HomeLayoutShellProps = {
    children: React.ReactNode;
};

export default function HomeLayoutShell({ children }: HomeLayoutShellProps) {
    const [expanded, setExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 767px)");

        const handleChange = () => {
            const mobile = media.matches;
            setIsMobile(mobile);

            // ao trocar de desktop para mobile, mantém recolhido por padrão
            if (mobile) {
                setExpanded(false);
            }
        };

        handleChange();
        media.addEventListener("change", handleChange);

        return () => media.removeEventListener("change", handleChange);
    }, []);

    return (
        <div className="relative min-h-screen">
            {/* overlay apenas no mobile quando expandido */}
            {isMobile && expanded && (
                <button
                    type="button"
                    aria-label="Fechar menu"
                    onClick={() => setExpanded(false)}
                    className="fixed inset-0 z-40 bg-black/45"
                />
            )}

            <HomeSideNav
                expanded={expanded}
                isMobile={isMobile}
                onToggle={() => setExpanded((prev) => !prev)}
                onClose={() => setExpanded(false)}
            />

            <div
                className={clsx(
                    "transition-all duration-300",
                    isMobile
                        ? "pl-[6.5rem]"
                        : expanded
                            ? "pl-[17rem]"
                            : "pl-[6.5rem]"
                )}
            >
                {children}
            </div>
        </div>
    );
}