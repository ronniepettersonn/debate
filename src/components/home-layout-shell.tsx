"use client";

import { useEffect, useState } from "react";
import HomeSideNav from "@/components/home-side-nav";
import clsx from "clsx";

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

            if (mobile) {
                setExpanded(false);
            }
        };

        handleChange();
        media.addEventListener("change", handleChange);

        return () => media.removeEventListener("change", handleChange);
    }, []);

    return (
        <div className="min-h-screen bg-bg bg-grid text-text">
            <div className="mx-auto flex max-w-7xl gap-3 px-3  md:gap-4 md:px-4 md:py-6">
                {/* coluna real do menu recolhido */}
                <div
                    className={clsx(
                        "shrink-0 pt-3",
                        isMobile
                            ? "w-[4.25rem]"
                            : expanded
                                ? "w-[17rem]"
                                : "w-[4.25rem]"
                    )}
                >
                    <div className="sticky top-3 md:top-6">
                        <HomeSideNav
                            expanded={!isMobile && expanded}
                            isMobile={isMobile}
                            onToggle={() => setExpanded((prev) => !prev)}
                            onClose={() => setExpanded(false)}
                        />
                    </div>
                </div>

                <div className="min-w-0 flex-1">{children}</div>
            </div>

            {/* overlay somente no mobile expandido */}
            {isMobile && expanded && (
                <>
                    <button
                        type="button"
                        aria-label="Fechar menu"
                        onClick={() => setExpanded(false)}
                        className="fixed inset-0 z-40 bg-black/45"
                    />

                    <div className="fixed left-3 top-3 z-50 h-[calc(100dvh-24px)] w-[17rem]">
                        <HomeSideNav
                            expanded={true}
                            isMobile={true}
                            onToggle={() => setExpanded(false)}
                            onClose={() => setExpanded(false)}
                            overlay
                        />
                    </div>
                </>
            )}
        </div>
    );
}