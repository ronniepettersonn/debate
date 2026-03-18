"use client";

import { useEffect } from "react";

type Props = {
    query: string;
    containerId: string;
};

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function unwrapPreviousHighlights(container: HTMLElement) {
    const marks = container.querySelectorAll("mark[data-search-highlight='true']");

    marks.forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;

        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
    });
}

function getTextNodes(root: Node): Text[] {
    const textNodes: Text[] = [];

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;

                if (!parent) return NodeFilter.FILTER_REJECT;

                const tag = parent.tagName.toLowerCase();

                if (
                    tag === "script" ||
                    tag === "style" ||
                    tag === "noscript" ||
                    tag === "mark"
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (!node.textContent?.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            },
        }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
        textNodes.push(currentNode as Text);
        currentNode = walker.nextNode();
    }

    return textNodes;
}

export default function SearchHighlight({ query, containerId }: Props) {
    useEffect(() => {
        const container = document.getElementById(containerId);
        if (!container) return;

        unwrapPreviousHighlights(container);

        const normalizedQuery = query.trim();
        if (!normalizedQuery) return;

        const regex = new RegExp(escapeRegExp(normalizedQuery), "gi");
        const querySlug = slugify(normalizedQuery);

        let occurrenceIndex = 0;
        const textNodes = getTextNodes(container);

        for (const textNode of textNodes) {
            const text = textNode.textContent || "";
            regex.lastIndex = 0;

            const matches = Array.from(text.matchAll(regex));
            if (matches.length === 0) continue;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            for (const match of matches) {
                const matchText = match[0];
                const start = match.index ?? 0;
                const end = start + matchText.length;

                if (start > lastIndex) {
                    fragment.appendChild(
                        document.createTextNode(text.slice(lastIndex, start))
                    );
                }

                occurrenceIndex += 1;

                const mark = document.createElement("mark");
                mark.textContent = matchText;
                mark.id = `search-${querySlug}-${occurrenceIndex}`;
                mark.setAttribute("data-search-highlight", "true");
                mark.className = "rounded bg-gold/25 px-1 text-gold";

                fragment.appendChild(mark);
                lastIndex = end;
            }

            if (lastIndex < text.length) {
                fragment.appendChild(
                    document.createTextNode(text.slice(lastIndex))
                );
            }

            textNode.parentNode?.replaceChild(fragment, textNode);
        }
    }, [query, containerId]);

    return null;
}